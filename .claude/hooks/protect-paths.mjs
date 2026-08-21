// PreToolUse: require explicit confirmation before Edit/Write touches
// .env*, anything under supabase/migrations/, or CLAUDE.md.
import { readFileSync } from "node:fs";
const input = JSON.parse(readFileSync(0, "utf-8"));
const path = (input.tool_input?.file_path ?? "").replace(/\\/g, "/");

const protectedPaths = [/\.env(\..+)?$/, /\/supabase\/migrations\//, /(^|\/)CLAUDE\.md$/];

if (protectedPaths.some((re) => re.test(path))) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `"${path}" is a protected path (env secrets / migrations / CLAUDE.md) — please confirm this edit is intended.`,
      },
    })
  );
}
