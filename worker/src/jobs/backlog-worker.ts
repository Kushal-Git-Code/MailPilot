import { Worker } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { BACKLOG_QUEUE_NAME, decrypt, type BacklogJobData } from "shared";
import { fetchGmailMessagesForRange } from "../gmail/fetch.js";

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

      const messages = await fetchGmailMessagesForRange(oauth2Client, dateRange);
      console.log(`[backlog-worker] Fetched ${messages.length} message(s) for user ${userId}`);

      // Classification (Step 19), DB writes (Step 21), and Gmail labeling
      // (Step 22) land in later steps — Step 18 only proves the fetch works.
      return { fetchedCount: messages.length };
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[backlog-worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
