import "../env.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { classifyEmail } from "./classify.js";
import type { FetchedMessage } from "../gmail/fetch.js";

interface Fixture {
  id: string;
  subject: string;
  from: string;
  body: string;
  expected: { priority: boolean; category: string };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.resolve(__dirname, "../../../evals/fixtures.json");
const fixtures: Fixture[] = JSON.parse(readFileSync(fixturesPath, "utf-8"));

let priorityCorrect = 0;
let categoryCorrect = 0;
let bothCorrect = 0;
const failures: string[] = [];

for (const fixture of fixtures) {
  const fakeMessage: FetchedMessage = {
    gmailMessageId: fixture.id,
    gmailThreadId: fixture.id,
    subject: fixture.subject,
    from: fixture.from,
    receivedAt: new Date().toISOString(),
    snippet: fixture.body.slice(0, 100),
    body: fixture.body,
  };

  const result = await classifyEmail(fakeMessage);
  const priorityMatch = result.priority === fixture.expected.priority;
  const categoryMatch = result.category === fixture.expected.category;

  if (priorityMatch) priorityCorrect++;
  if (categoryMatch) categoryCorrect++;
  if (priorityMatch && categoryMatch) bothCorrect++;

  const status = priorityMatch && categoryMatch ? "PASS" : "FAIL";
  console.log(
    `[${status}] ${fixture.id}: expected priority=${fixture.expected.priority} category=${fixture.expected.category} | got priority=${result.priority} category=${result.category} (confidence=${result.confidence ?? "n/a"})`
  );
  if (status === "FAIL") {
    failures.push(`  ${fixture.id}: "${result.reason}"`);
  }
}

const total = fixtures.length;
console.log("\n--- Summary ---");
console.log(`Priority accuracy: ${priorityCorrect}/${total} (${((priorityCorrect / total) * 100).toFixed(1)}%)`);
console.log(`Category accuracy: ${categoryCorrect}/${total} (${((categoryCorrect / total) * 100).toFixed(1)}%)`);
console.log(`Both correct: ${bothCorrect}/${total} (${((bothCorrect / total) * 100).toFixed(1)}%)`);

if (failures.length > 0) {
  console.log("\nFailures (reason Claude gave):");
  for (const f of failures) console.log(f);
}
