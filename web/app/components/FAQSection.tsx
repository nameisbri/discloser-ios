"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
}

export default function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-surface/50 border border-surface-light rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full text-left px-6 py-4 flex justify-between items-center gap-4"
            aria-expanded={openIndex === index}
          >
            <span className="font-medium text-white/90">{item.question}</span>
            <span
              className="text-white/50 text-xl shrink-0 transition-transform duration-200"
              style={{
                transform: openIndex === index ? "rotate(45deg)" : "rotate(0deg)",
              }}
              aria-hidden="true"
            >
              +
            </span>
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-4 text-sm text-white/70 leading-relaxed">
                  {item.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
