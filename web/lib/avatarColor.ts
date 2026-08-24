// Shared between the sidebar (your own identity) and any per-sender avatar
// (dashboard cards) — one implementation, so the "same input always gets the
// same color" guarantee can't drift between the two call sites.

// Pulls the display name out of a raw "From" header for avatar purposes only
// (e.g. `Google Play <googleplay-noreply@google.com>` -> `Google Play`) —
// deliberately separate from shared's extractEmailAddress, which is scoped
// narrowly to the correction-rule match and isn't meant for other uses.
export function displayNameFromHeader(from: string): string {
  const withoutEmail = from.replace(/<[^>]*>/, "").trim().replace(/^["']|["']$/g, "");
  return withoutEmail || from;
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic per-name color, not random — the same person always gets
// the same avatar color across renders/sessions, a real recognition cue.
const AVATAR_COLORS = ["bg-coral", "bg-gold", "bg-tertiary", "bg-sky", "bg-rose"];

export function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
