// PostToolUse: after Edit/Write, typecheck (+ lint for /web) the touched
// project. Non-zero exit feeds the error back before the next step.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const input = JSON.parse(readFileSync(0, "utf-8"));
const path = (input.tool_input?.file_path ?? "").replace(/\\/g, "/");

let cwd = null;
let cmd = null;
if (path.includes("/web/")) {
  cwd = "web";
  cmd = "npx tsc --noEmit && npx next lint --quiet";
} else if (path.includes("/worker/")) {
  cwd = "worker";
  cmd = "npx tsc --noEmit";
}
if (!cwd) process.exit(0);

try {
  execSync(cmd, { cwd, stdio: "pipe" });
} catch (err) {
  console.error(`Lint/typecheck failed in ${cwd}:\n${err.stdout}${err.stderr}`);
  process.exit(2);
}
