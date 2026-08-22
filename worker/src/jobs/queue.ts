import { Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { BACKLOG_QUEUE_NAME } from "shared";

let queue: Queue | null = null;

// Used to re-enqueue the remainder of a backlog scan once the daily cap
// resets — the worker needs a producer too, not just its Worker (consumer).
export function getBacklogQueue() {
  if (!queue) {
    const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    queue = new Queue(BACKLOG_QUEUE_NAME, { connection });
  }
  return queue;
}
