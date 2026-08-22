# UI/UX Design Brief — MailPilot

**Screen/Flow:** Full app (Phase 1: Inbox dashboard, Onboarding, Settings)
**Audience:** Knowledge workers/professionals who want their inbox handled with minimal cognitive load.
**Brand:** Cheerful, colorful, and energetic — a tool that feels good to open, not another gray productivity app. Motion and depth do real work here: buttons feel tactile, cards feel like they have weight, transitions feel alive.

> **Revision note (2026-08-22):** This brief previously specified a calm, restrained, single-accent-color direction (Notion/Superhuman as reference). That direction is superseded by this revision, at the user's explicit request, to a colorful, motion-forward, tactile direction. Pages already built under the old direction (`/login`, the Step 11-13 placeholders) will be revisited to match; new pages (starting with Phase 4, Step 15) are built to this revision directly.

---

## Aesthetic Direction

Warm, colorful, and dimensional. Where the previous direction used color only for hierarchy, this direction uses color for **personality** too — multiple accent colors, soft gradients, and layered shadows are all in play. Motion is a first-class part of the design, not a subtle accent: buttons respond to hover/press with tilt and depth, cards lift, page transitions carry weight.

**Still true from before:** clarity and trust still matter — this is a tool handling someone's real email. Cheerful doesn't mean cluttered; one clear focal action per screen is still the rule, it's just expressed with more color and motion than before.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary accent | `#6366F1` (vibrant indigo) | Primary buttons, active nav state, links, focus rings |
| Primary accent hover | `#4F46E5` | Button hover/active states |
| Secondary accent | `#FB923C` (warm coral-orange) | Secondary highlights, decorative shapes, alternate CTAs |
| Tertiary accent | `#2DD4BF` (teal) | Decorative accents, variety in illustrations/blobs — used sparingly, not for primary actions |
| Background | Soft gradient, `#FDF4FF` → `#F0F9FF` (light violet to light sky blue) | Page background — replaces the old flat cream |
| Surface (cards) | `#FFFFFF` | Cards, panels, modals |
| Surface shadow | Colored glow — `0 8px 24px rgba(99, 102, 241, 0.15)` | Replaces the old flat gray shadow; tint the shadow with whichever accent is nearby |
| Text primary | `#1E1B4B` (deep indigo-black) | Headings, primary body text — warmer than pure black |
| Text secondary | `#6B7280` | Metadata, timestamps, secondary labels |
| Border/divider | `#E5E0FF` (soft violet-tinted gray) | Card borders, dividers |
| Success/positive | `#22C55E` | "All caught up" states, confirmations |
| Error/destructive | `#EF4444` | Errors, destructive confirmations — used sparingly |

Multiple accent colors are now allowed on one screen (unlike the old single-accent rule) — but still with restraint: one primary action per screen, secondary/tertiary colors for decoration and variety, not for competing calls to action.

---

## Typography

Unchanged from before — still Inter, still 3 sizes only (20px/semibold heading, 14px/regular body, 12px/regular meta). Personality here comes from color and motion, not from typographic noise.

---

## Component Style

- **Border radius:** 12px (up from 8px) — slightly softer, friendlier.
- **Shadows:** Colored/tinted shadows (see palette table) instead of flat gray — gives cards a sense of depth and warmth.
- **Buttons:** Tactile and animated —
  - **Hover:** slight lift + tilt (CSS 3D transform: `perspective` + `rotateX`/`rotateY` on cursor position, or a simpler fixed lift via Framer Motion's `whileHover={{ y: -2, scale: 1.02 }}`) plus a soft colored glow shadow.
  - **Press:** scale down slightly (`whileTap={{ scale: 0.97 }}`) for tactile feedback.
  - Primary buttons: filled, gradient-friendly (indigo primary, can blend toward the secondary coral on decorative buttons).
  - Still: one primary (filled) button per screen maximum; others secondary/outlined.
- **Motion library:** Framer Motion, for page transitions, button/card interactions, and simple floating/decorative animated shapes. CSS-based 3D transforms (`perspective`, `rotateX/Y`, `translateZ`) rather than a full WebGL/Three.js scene — real dimensional motion without the extra rendering weight.

---

## Key UI Patterns

**Motion, generally:**
- Page transitions: fade + slight scale/slide on route change (not just on first load like before).
- Cards/buttons: tilt-on-hover, lift-on-hover, press-down-on-click — every interactive element should feel like it has physical presence.
- Decorative elements: soft floating gradient shapes/blobs in the background are welcome on marketing/onboarding-style screens, animated with a slow, subtle drift (not distracting from the actual task).
- Classification events (dashboard list items appearing) keep a fade + slide-in, just with more spring/bounce in the easing than the old flat 150-200ms ease-out.

**Inbox dashboard, empty states, etc.:** structural guidance (one focal action, sender/reason/timestamp shown, no snippet caching) is unchanged from before — only the visual treatment (color, shadow, motion) changes.

---

## Dark/Light Mode

Light mode only for v1 — unchanged.

---

## Reference Apps

No longer modeling Notion/Superhuman restraint. Think more energetic, colorful consumer/productivity hybrids — apps that use gradient, depth, and motion to feel alive (e.g. Linear's marketing site motion, Stripe's gradient/depth language, Duolingo's tactile button feel) as inspiration for the *feel*, while keeping MailPilot's own layout/IA (still one focal action, still no dense multi-color category dashboards).

---

## Mobile

Fully responsive — unchanged structurally. Motion should be present but lighter on mobile (shorter distances, less parallax) to keep it feeling snappy rather than laggy on lower-powered devices.

---

## Accessibility

- Text/background contrast checked against WCAG AA — needs re-verification with the new palette (deep indigo text on the light gradient background, white text on the new indigo/coral buttons) at implementation time, same caveat as before just against new colors.
- No information conveyed by color alone.
- All interactive elements reachable via keyboard, visible focus states in the primary accent color.
- Respect `prefers-reduced-motion` — anyone with that OS setting enabled should get the old, calmer transitions (simple fade, no tilt/bounce), not just smaller versions of the same motion.
