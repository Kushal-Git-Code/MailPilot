// Throwaway demo script — shows encrypted-at-rest vs decrypted Gmail
// tokens side by side. Run this yourself, then it can be deleted.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createDecipheriv } from "node:crypto";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1).trim()];
    })
);

function decrypt(ciphertext, keyHex) {
  const key = Buffer.from(keyHex, "hex");
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin
  .from("gmail_tokens")
  .select("gmail_address, access_token, refresh_token")
  .limit(1)
  .single();

if (error) {
  console.log("No gmail_tokens row found. Connect Gmail first at /onboarding/connect, then rerun this.");
  process.exit(0);
}

console.log(`Gmail account: ${data.gmail_address}\n`);

console.log("--- What's actually stored in the database (encrypted) ---");
console.log("access_token: ", data.access_token.slice(0, 50) + "...");
console.log("refresh_token:", data.refresh_token.slice(0, 50) + "...");

const decryptedAccess = decrypt(data.access_token, env.TOKEN_ENCRYPTION_KEY);
const decryptedRefresh = decrypt(data.refresh_token, env.TOKEN_ENCRYPTION_KEY);

console.log("\n--- What it decrypts back to (only shown truncated — real secret, don't share) ---");
console.log("access_token: ", decryptedAccess.slice(0, 15) + "... (real Google tokens start with 'ya29.')");
console.log("refresh_token:", decryptedRefresh.slice(0, 15) + "... (real Google tokens start with '1//')");
