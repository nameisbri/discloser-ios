"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { stagger } from "./animations";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  "aria-labelledby"?: string;
}

export default function AnimatedSection({
  children,
  className,
  "aria-labelledby": ariaLabelledBy,
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </motion.section>
  );
}
