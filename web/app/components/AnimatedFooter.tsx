"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function AnimatedFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative z-10 px-6 py-12 border-t border-surface-light"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logomark.png"
            alt="Discloser - Privacy-first sexual health app logo"
            width={28}
            height={28}
            loading="lazy"
          />
          <span className="text-white/75 text-sm">Discloser</span>
        </div>
        <p className="text-white/65 text-sm italic">
          Be adventurous. Stay anonymous.
        </p>
        <div className="flex gap-6 text-sm text-white/65">
          <a href="/privacy" className="hover:text-white/75 transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-white/75 transition-colors">
            Terms
          </a>
          <a
            href="mailto:hello@discloser.app"
            className="hover:text-white/75 transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
      <p className="text-center text-white/50 text-xs mt-8">
        &copy; 2026 Discloser
      </p>
    </motion.footer>
  );
}
