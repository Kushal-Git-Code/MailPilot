"use client";

import { motion } from "framer-motion";

export function ConnectButton() {
  return (
    <motion.a
      href="/api/auth/gmail/connect"
      className="inline-block rounded-xl bg-gradient-to-r from-accent to-accent-hover px-8 py-3.5 text-sm font-semibold text-white shadow-glow"
      style={{ perspective: 600 }}
      whileHover={{ y: -3, scale: 1.03, rotateX: 4 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      Connect Gmail
    </motion.a>
  );
}
