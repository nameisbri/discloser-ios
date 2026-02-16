"use client";

import { motion } from "framer-motion";

interface SurveyButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function SurveyButton({ href, children }: SurveyButtonProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{
        scale: 1.03,
        backgroundColor: "rgba(146, 61, 92, 0.1)",
      }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-burgundy/30 text-burgundy transition-colors"
    >
      {children}
    </motion.a>
  );
}
