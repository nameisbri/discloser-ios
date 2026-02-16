"use client";

import { motion } from "framer-motion";
import { CheckCircle, Link2, Eye, ShieldCheck } from "lucide-react";

export default function ShareCardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: 2 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
      className="bg-bg-dark rounded-2xl border border-surface-light shadow-2xl shadow-burgundy/10 p-6 sm:p-8 max-w-sm mx-auto sm:mx-0"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-success" aria-hidden="true" />
        </div>
        <div>
          <p className="font-display font-bold text-text-primary-dark text-lg">All Clear</p>
          <p className="text-xs text-text-secondary-dark">Tested Jan 3, 2026</p>
        </div>
      </div>

      {/* Test results row */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["HIV", "Chlamydia", "Gonorrhea", "Syphilis"].map((test) => (
          <span
            key={test}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success"
          >
            {test} —
          </span>
        ))}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-text-secondary-dark mb-5 pb-5 border-b border-surface-light">
        <span className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
          Expires in 24h
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          3 views left
        </span>
      </div>

      {/* Verification badge */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-success" aria-hidden="true" />
        <span className="text-xs font-medium text-success">
          Verified with high confidence
        </span>
      </div>
    </motion.div>
  );
}
