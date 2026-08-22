import { Queue } from "bullmq";
import IORedis from "ioredis";
import { BACKLOG_QUEUE_NAME } from "shared";

let queue: Queue | null = null;

export function getBacklogQueue() {
  if (!queue) {
    // BullMQ requires maxRetriesPerRequest: null on the connection for its
    // blocking commands to work correctly.
    const connection = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    });
    queue = new Queue(BACKLOG_QUEUE_NAME, { connection });
  }
  return queue;
}
