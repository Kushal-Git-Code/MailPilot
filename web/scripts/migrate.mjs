// Runs SQL migration files from /supabase/migrations against DATABASE_URL.
//
// Usage:
//   node scripts/migrate.mjs up      — runs every non-rollback .sql file, in filename order
//   node scripts/migrate.mjs down    — runs every *_rollback.sql file, in reverse filename order
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../supabase/migrations");
const envPath = path.resolve(__dirname, "../.env.local");

const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1).trim()];
    })
);

const mode = process.argv[2] ?? "up";
if (mode !== "up" && mode !== "down") {
  console.error('Usage: node scripts/migrate.mjs [up|down]');
  process.exit(1);
}

const allFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
const files = (
  mode === "up"
    ? allFiles.filter((f) => !f.includes("_rollback"))
    : allFiles.filter((f) => f.includes("_rollback"))
).sort();
if (mode === "down") files.reverse();

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Running ${file} ...`);
    await client.query(sql);
    console.log(`  OK`);
  }
  console.log(`\n${mode === "up" ? "Migrations" : "Rollback"} complete.`);
} finally {
  await client.end();
}
