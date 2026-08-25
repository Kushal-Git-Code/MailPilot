"use client";

import { motion } from "framer-motion";

export function ConnectButton() {
  return (
    <motion.a
      href="/api/auth/gmail/connect"
      className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent to-gold px-8 py-3.5 font-display text-sm font-bold text-white shadow-glow"
      style={{ perspective: 600 }}
      whileHover={{ y: -3, scale: 1.03, rotateX: 4 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.7 6.6 29.1 5 24 5 13 5 4 14 4 25s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.7 6.6 29.1 5 24 5c-7.6 0-14.2 4.3-17.7 10.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 45c5.1 0 9.7-1.9 13.2-5l-6.1-5.2C29.2 36.4 26.7 37 24 37c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.7 40.6 16.3 45 24 45z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5.2C40.5 36.5 44 31.2 44 25c0-1.3-.1-2.6-.4-4.5z"
        />
      </svg>
      Connect Gmail
    </motion.a>
  );
}
