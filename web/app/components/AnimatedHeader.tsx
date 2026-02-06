"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SURVEY_URL } from "./constants";

export default function AnimatedHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative z-10 p-6 flex justify-between items-center max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-2">
        <Image
          src="/logomark.png"
          alt="Discloser - Privacy-first sexual health app logo"
          width={36}
          height={36}
          priority
        />
        <span className="font-semibold text-white/90">Discloser</span>
      </div>
      <a
        href={SURVEY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-white/75 hover:text-accent transition-colors"
      >
        Take our survey
      </a>
    </motion.header>
  );
}
