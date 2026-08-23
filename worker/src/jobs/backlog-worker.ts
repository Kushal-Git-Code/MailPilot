import { Worker } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { google } from "googleapis";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BACKLOG_QUEUE_NAME, decrypt, type BacklogJobData } from "shared";
import { fetchGmailMessagesForRange } from "../gmail/fetch.js";
import { classifyEmail } from "../classification/classify.js";
import { persistClassification } from "../classification/persist.js";
import { applyPriorityLabel } from "../gmail/label.js";
import { getRemainingDailyCapacity, incrementDailyCount, msUntilNextReset } from "../limits/dailyCap.js";
import { getBacklogQueue } from "./queue.js";

// Same bounded-concurrency pattern as gmail/fetch.ts — classification is
// one Claude call per email (~2-3s), so sequential processing was the
// dominant cost of a backlog scan.
const CONCURRENCY = 10;

async function alreadyProcessedIds(supabase: SupabaseClient, userId: string, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase
    .from("emails")
    .select("gmail_message_id")
    .eq("user_id", userId)
    .in("gmail_message_id", ids);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.gmail_message_id));
}

export function startBacklogWorker() {
  const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const worker = new Worker<BacklogJobData>(
    BACKLOG_QUEUE_NAME,
    async (job) => {
      const { userId, dateRange } = job.data;
      console.log(`[backlog-worker] Processing job ${job.id} for user ${userId} (${dateRange})`);

      const { data: tokenRow, error } = await supabase
        .from("gmail_tokens")
        .select("refresh_token, status")
        .eq("user_id", userId)
        .single();
      if (error || !tokenRow || tokenRow.status !== "active") {
        throw new Error(`No active Gmail connection for user ${userId}`);
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI
      );
      oauth2Client.setCredentials({ refresh_token: decrypt(tokenRow.refresh_token) });

      const allMessages = await fetchGmailMessagesForRange(oauth2Client, dateRange);
      console.log(`[backlog-worker] Fetched ${allMessages.length} message(s) for user ${userId}`);

      // Skip messages already written to `emails` (Step 21's unique
      // constraint makes this safe) — this is also what makes "resume
      // tomorrow" work without any separate cursor/pagination state.
      const doneIds = await alreadyProcessedIds(
        supabase,
        userId,
        allMessages.map((m) => m.gmailMessageId)
      );
      const pending = allMessages.filter((m) => !doneIds.has(m.gmailMessageId));
      console.log(`[backlog-worker] ${pending.length} message(s) not yet processed`);

      const { remaining, resetAt } = await getRemainingDailyCapacity(supabase, userId);
      const toProcess = pending.slice(0, remaining);
      const leftover = pending.length - toProcess.length;
      console.log(
        `[backlog-worker] Daily cap remaining: ${remaining}. Processing ${toProcess.length} now, ${leftover} left over.`
      );

      let processedCount = 0;
      let priorityCount = 0;
      for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
        const batch = toProcess.slice(i, i + CONCURRENCY);
        const flags = await Promise.all(
          batch.map(async (message) => {
            const classification = await classifyEmail(message);
            const { emailId } = await persistClassification(supabase, {
              userId,
              gmailMessageId: message.gmailMessageId,
              gmailThreadId: message.gmailThreadId,
              receivedAt: message.receivedAt,
              classification,
            });
            if (classification.priority) {
              await applyPriorityLabel(supabase, oauth2Client, {
                userId,
                gmailMessageId: message.gmailMessageId,
                emailId,
              });
            }
            return classification.priority;
          })
        );
        processedCount += batch.length;
        priorityCount += flags.filter(Boolean).length;
      }
      await incrementDailyCount(supabase, userId, processedCount);
      console.log(
        `[backlog-worker] Classified ${processedCount} email(s), ${priorityCount} flagged priority.`
      );

      if (leftover > 0) {
        const delay = msUntilNextReset(resetAt);
        await getBacklogQueue().add("scan", { userId, dateRange }, { delay });
        console.log(
          `[backlog-worker] Daily cap reached — ${leftover} message(s) queued to resume in ${Math.round(delay / 60000)} min.`
        );
      }

      return { processedCount, priorityCount, leftover };
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[backlog-worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
