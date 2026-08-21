import type { Placeholder } from "shared";

console.log("MailPilot worker: hello world by KT");

const sharedTypeCheck: Placeholder = { id: "shared-import-ok" };
console.log(`MailPilot worker: shared import resolved (${sharedTypeCheck.id})`);
