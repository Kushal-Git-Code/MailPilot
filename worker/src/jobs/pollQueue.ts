import { Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { POLL_QUEUE_NAME } from "shared";

let queue: Queue | null = null;

export function getPollQueue() {
  if (!queue) {
    const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    queue = new Queue(POLL_QUEUE_NAME, { connection });
  }
  return queue;
}
