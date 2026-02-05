"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";

export default function ParallaxBlobs() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -200]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -350]);
  const blob3Y = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -150]);
  const smoothBlob1Y = useSpring(blob1Y, { stiffness: 50, damping: 20 });
  const smoothBlob2Y = useSpring(blob2Y, { stiffness: 50, damping: 20 });
  const smoothBlob3Y = useSpring(blob3Y, { stiffness: 50, damping: 20 });

  return (
    <>
      <motion.div
        style={{ y: smoothBlob1Y }}
        className="glow-blob w-[600px] h-[600px] bg-accent-purple -top-40 -left-40 fixed -z-10"
      />
      <motion.div
        style={{ y: smoothBlob2Y }}
        className="glow-blob w-[500px] h-[500px] bg-accent top-1/3 -right-40 fixed -z-10"
      />
      <motion.div
        style={{ y: smoothBlob3Y }}
        className="glow-blob w-[400px] h-[400px] bg-primary bottom-0 left-1/4 fixed -z-10"
      />
    </>
  );
}
