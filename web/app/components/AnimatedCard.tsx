"use client";

import { motion, type Variants } from "framer-motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  hoverY?: number;
}

export default function AnimatedCard({
  children,
  className,
  variants,
  hoverY = -5,
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={variants}
      whileHover={{ y: hoverY, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
