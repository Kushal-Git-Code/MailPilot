import "./env.js";
import { startBacklogWorker } from "./jobs/backlog-worker.js";
import { startPollScheduler, scheduleRecurringPoll } from "./jobs/pollScheduler.js";

console.log("MailPilot worker: starting...");
startBacklogWorker();
console.log("MailPilot worker: listening for backlog-classification jobs");

startPollScheduler();
await scheduleRecurringPoll();
console.log("MailPilot worker: listening for poll-scheduler ticks");
