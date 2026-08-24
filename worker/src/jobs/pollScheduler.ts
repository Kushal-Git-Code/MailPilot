import { Worker } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { POLL_QUEUE_NAME } from "shared";
import { getBacklogQueue } from "./queue.js";
import { getPollQueue } from "./pollQueue.js";

// Gap 1 (US-2): hourly, not every 2 minutes. Emails stay fully visible in
// the user's real Gmail inbox the whole time regardless of MailPilot's own
// processing lag — a delayed label is a much softer failure than a hidden
// email, so an hour is a deliberate, considered choice, not a compromise.
// Chosen after weighing standing Gmail-quota/infra cost (this runs forever,
// for every connected user) against dashboard freshness — see PROGRESS.md.
const POLL_INTERVAL_MS = 60 * 60 * 1000;
const TICK_JOB_ID = "recurring-poll-tick";

async function activeUserIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("gmail_tokens").select("user_id").eq("status", "active");
  if (error) throw error;
  return (data ?? []).map((row) => row.user_id);
}

export function startPollScheduler() {
  const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const worker = new Worker(
    POLL_QUEUE_NAME,
    async () => {
      const userIds = await activeUserIds(supabase);
      const backlogQueue = getBacklogQueue();

      let enqueued = 0;
      let skipped = 0;

      for (const userId of userIds) {
        const jobId = `forward-${userId}`;
        // Don't pile a duplicate on top of a forward scan that's still
        // running or already waiting — this user gets picked up on the
        // next tick instead. The underlying data layer (upsert + unique
        // constraint) is already race-safe even if this check ever missed
        // a case, so this is a real optimization, not a correctness
        // requirement — no need for airtight coverage across every
        // possible job-origin type.
        const existing = await backlogQueue.getJob(jobId);
        if (existing) {
          const state = await existing.getState();
          if (state === "active" || state === "waiting" || state === "delayed") {
            skipped++;
            continue;
          }
        }

        await backlogQueue.add(
          "scan",
          { userId, dateRange: "forward" },
          {
            jobId,
            // Must be `true`, not a count. BullMQ's addStandardJob script
            // checks `EXISTS jobIdKey` and silently returns the *existing*
            // job (see handleDuplicatedJob) if a job with this id is still
            // present — it does not start a new run. A count-based policy
            // only trims once more than N completions pile up, which never
            // happens for a single reused static id, so the completed job
            // would sit there forever and every future poll tick for this
            // user would silently no-op (confirmed via two manual ticks:
            // attemptsMade stayed at 1). `true` removes the job the moment
            // it completes/fails, freeing the id immediately for the next
            // tick. Job history for this queue isn't needed for debugging —
            // triage_sessions and audit_log are the sources of truth for
            // what actually happened.
            removeOnComplete: true,
            removeOnFail: true,
          }
        );
        enqueued++;
      }

      console.log(
        `[poll-scheduler] Checked ${userIds.length} user(s): ${enqueued} enqueued, ${skipped} skipped (already in flight).`
      );
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[poll-scheduler] Tick failed:`, err.message);
  });

  return worker;
}

// Idempotent to call on every worker startup — upsertJobScheduler is an
// upsert by design (BullMQ 6.x moved repeatable jobs off Queue.add/repeat
// entirely), so re-registering the same schedulerId on restart updates the
// existing schedule rather than creating a duplicate one.
export async function scheduleRecurringPoll() {
  await getPollQueue().upsertJobScheduler(
    TICK_JOB_ID,
    { every: POLL_INTERVAL_MS },
    {
      name: "tick",
      data: {},
      opts: {
        removeOnComplete: { count: 20 },
        removeOnFail: { count: 50 },
      },
    }
  );
  console.log(`[poll-scheduler] Recurring poll scheduled every ${POLL_INTERVAL_MS / 60000} min.`);
}
