import "./env.js";
import { startBacklogWorker } from "./jobs/backlog-worker.js";

console.log("MailPilot worker: starting...");
startBacklogWorker();
console.log("MailPilot worker: listening for backlog-classification jobs");
