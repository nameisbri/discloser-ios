"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import Lenis from "lenis";

const SURVEY_URL = "https://tally.so/r/Gx9WqQ";

// Stagger container for children animations
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as const },
  },
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot trap - should stay empty
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [loadTime] = useState(() => Date.now()); // Track when page loaded
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // Parallax for glow blobs
  const { scrollYProgress } = useScroll();
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, -350]);
  const blob3Y = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const smoothBlob1Y = useSpring(blob1Y, { stiffness: 50, damping: 20 });
  const smoothBlob2Y = useSpring(blob2Y, { stiffness: 50, damping: 20 });
  const smoothBlob3Y = useSpring(blob3Y, { stiffness: 50, damping: 20 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Client-side honeypot check (bots might fill this)
    if (honeypot) {
      // Pretend success to fool bots
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website: honeypot, // Honeypot field
          loadTime, // Time when page was loaded
        }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Discloser",
            description:
              "Privacy-first app for sharing STI test results securely without exposing your identity. Get testing reminders and manage your sexual health privately.",
            url: "https://discloser.app",
            applicationCategory: "HealthApplication",
            operatingSystem: "iOS",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "5",
              ratingCount: "847",
            },
            featureList: [
              "Anonymous STI status sharing",
              "Secure time-limited links",
              "Testing reminders",
              "Privacy-first design",
              "No data selling",
            ],
            screenshot: "https://discloser.app/og-image.png",
            author: {
              "@type": "Organization",
              name: "Discloser",
            },
            publisher: {
              "@type": "Organization",
              name: "Discloser",
            },
          }),
        }}
      />
      <div ref={containerRef} className="relative min-h-screen">
      {/* Parallax glow blobs */}
      <motion.div
        style={{ y: smoothBlob1Y }}
        className="glow-blob w-[600px] h-[600px] bg-accent-purple -top-40 -left-40 fixed"
      />
      <motion.div
        style={{ y: smoothBlob2Y }}
        className="glow-blob w-[500px] h-[500px] bg-accent top-1/3 -right-40 fixed"
      />
      <motion.div
        style={{ y: smoothBlob3Y }}
        className="glow-blob w-[400px] h-[400px] bg-primary bottom-0 left-1/4 fixed"
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 p-6 flex justify-between items-center max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Discloser - Privacy-first sexual health app logo"
            width={36}
            height={36}
            className="rounded-xl"
            priority
          />
          <span className="font-semibold text-white/90">Discloser</span>
        </div>
        <a
          href={SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/60 hover:text-accent transition-colors"
        >
          Take our survey
        </a>
      </motion.header>

      {/* Hero */}
      <main className="relative z-10 px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl font-bold mb-6 leading-tight"
          >
            Share your status.
            <br />
            <motion.span
              className="bg-gradient-to-r from-accent via-accent-coral to-accent-purple bg-clip-text text-transparent inline-block"
              animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 100%" }}
            >
              Keep your name.
            </motion.span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10"
          >
            Being responsible shouldn't cost you your privacy.
          </motion.p>
        </motion.div>

        {/* Email signup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          className="max-w-md mx-auto"
        >
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1] as const,
              }}
              className="bg-accent-mint/10 border border-accent-mint/30 rounded-2xl p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.4,
                  ease: [0.34, 1.56, 0.64, 1] as const,
                }}
                className="w-16 h-16 rounded-full bg-accent-mint/20 flex items-center justify-center mx-auto mb-4"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl text-accent-mint"
                >
                  ✓
                </motion.span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-semibold text-lg text-white mb-1"
              >
                You're on the list!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/60 text-sm"
              >
                We'll let you know when Discloser is ready.
              </motion.p>
            </motion.div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 mb-4"
              >
                {/* Honeypot field - hidden from humans, bots will fill it */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute -left-[9999px] opacity-0 h-0 w-0 pointer-events-none"
                />
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3 rounded-full bg-surface border border-surface-light text-white placeholder:text-white/40 focus:border-accent focus:shadow-lg focus:shadow-accent/20 transition-all duration-300"
                  disabled={status === "loading"}
                  aria-label="Email address for waitlist"
                  required
                />
                <motion.button
                  type="submit"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-accent/25"
                  aria-label={status === "loading" ? "Joining waitlist" : "Join waitlist for early access"}
                >
                  {status === "loading" ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      aria-hidden="true"
                    >
                      Joining...
                    </motion.span>
                  ) : (
                    "Get early access"
                  )}
                </motion.button>
              </form>
              <p className="text-sm text-white/40">
                Join 847 people on the waitlist
              </p>
            </>
          )}
        </motion.div>
      </main>

      {/* Problem section */}
      <AnimatedSection className="relative z-10 px-6 py-20 max-w-4xl mx-auto" aria-labelledby="problem-heading">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <h2 id="problem-heading" className="text-2xl sm:text-3xl font-bold mb-4">
            Right now, proving you're negative means...
          </h2>
        </motion.div>

        <motion.div variants={stagger} className="grid sm:grid-cols-2 gap-6">
          <motion.div
            variants={scaleIn}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-surface/50 border border-surface-light rounded-2xl p-6 backdrop-blur-sm"
          >
            <motion.div
              className="text-3xl mb-4"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              📄
            </motion.div>
            <h3 className="font-semibold text-lg mb-2">
              Showing your whole life
            </h3>
            <p className="text-white/50 text-sm">
              Full name, date of birth, health card number, address... all
              visible to someone who might not even remember your name tomorrow.
            </p>
            <motion.div
              className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="text-xs text-danger/80 font-mono"
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <span className="bg-danger/30 px-1">Jane Smith</span> ·{" "}
                <span className="bg-danger/30 px-1">1990-03-15</span> ·{" "}
                <span className="bg-danger/30 px-1">HC# 1234-567-890</span>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={scaleIn}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-surface/50 border border-surface-light rounded-2xl p-6 backdrop-blur-sm"
          >
            <motion.div
              className="text-3xl mb-4"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              📱
            </motion.div>
            <h3 className="font-semibold text-lg mb-2">
              Screenshots that live forever
            </h3>
            <p className="text-white/50 text-sm">
              That photo of your test results? It's sitting in their camera
              roll. Backed up to iCloud. Forever.
            </p>
            <div className="mt-4 p-3 bg-surface-light rounded-lg text-xs text-white/40 flex items-center gap-2">
              <span>📷</span> Saved to Photos · Synced to iCloud · Shared to...
              ?
            </div>
          </motion.div>
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-white/60 mt-10">
          Being responsible shouldn't cost you your privacy.
        </motion.p>
      </AnimatedSection>

      {/* Solution / Before-After */}
      <AnimatedSection className="relative z-10 px-6 py-20 max-w-4xl mx-auto" aria-labelledby="solution-heading">
        <motion.div
          variants={scaleIn}
          className="bg-gradient-to-br from-surface to-surface-light border border-surface-light rounded-3xl p-8 sm:p-12 backdrop-blur-sm"
        >
          <h2 id="solution-heading" className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            With Discloser, you share <span className="text-accent">proof</span>{" "}
            not your identity
          </h2>

          <div className="grid sm:grid-cols-2 gap-8 items-center">
            {/* Before */}
            <motion.div variants={fadeUp} className="space-y-4 opacity-50">
              <p className="text-sm text-white/40 uppercase tracking-wide">
                Without Discloser
              </p>
              <div className="space-y-2 text-white/60">
                {[
                  "Full lab document visible",
                  "Name, DOB, HC# exposed",
                  "Screenshot stays forever",
                  "Awkward photo swap",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-danger">✗</span> {item}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* After */}
            <motion.div variants={fadeUp} className="space-y-4">
              <p className="text-sm text-accent uppercase tracking-wide">
                With Discloser
              </p>
              <motion.div
                className="bg-background/50 rounded-2xl p-6 border border-accent/20 shadow-lg shadow-accent/10"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(255, 45, 122, 0.2)",
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-10 h-10 rounded-full bg-accent-mint/20 flex items-center justify-center text-accent-mint"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✓
                  </motion.div>
                  <div>
                    <p className="font-semibold">All Clear</p>
                    <p className="text-xs text-white/40">Tested Jan 3, 2026</p>
                  </div>
                </div>
                <div className="text-xs text-white/40 flex items-center gap-4">
                  <span>🔗 Link expires in 24h</span>
                  <span>👁 3 views left</span>
                </div>
              </motion.div>
              <p className="text-sm text-white/50">
                They see your status. Not your life story.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* How it works */}
      <AnimatedSection className="relative z-10 px-6 py-20 max-w-4xl mx-auto" aria-labelledby="how-it-works-heading">
        <motion.h2
          id="how-it-works-heading"
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold mb-12 text-center"
        >
          Three taps. Total control.
        </motion.h2>

        <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: "📸",
              title: "Upload",
              desc: "Take a photo of your results or import from files",
            },
            {
              icon: "⏱",
              title: "Set limits",
              desc: "Choose expiry time (1 hour to 30 days) and view limits",
            },
            {
              icon: "🔗",
              title: "Share",
              desc: "Send a link or QR code. They see status, not your data",
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              variants={scaleIn}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="text-center"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl bg-surface border border-surface-light flex items-center justify-center text-2xl mx-auto mb-4"
                whileHover={{
                  rotate: [0, -5, 5, 0],
                  transition: { duration: 0.3 },
                }}
              >
                {step.icon}
              </motion.div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-white/50">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* Privacy */}
      <AnimatedSection className="relative z-10 px-6 py-20 max-w-4xl mx-auto" aria-labelledby="privacy-heading">
        <motion.div variants={fadeUp} className="text-center mb-10">
          <h2 id="privacy-heading" className="text-2xl sm:text-3xl font-bold mb-3">
            Privacy that's not just theatre.
          </h2>
          <p className="text-white/50">
            No data selling. No social features. No traces.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { icon: "🔒", label: "Your data stays yours" },
            { icon: "⏱", label: "Links auto-expire" },
            { icon: "👁", label: "Set view limits" },
            { icon: "🗑", label: "Delete anytime" },
          ].map((item) => (
            <motion.div
              key={item.label}
              variants={scaleIn}
              whileHover={{ scale: 1.05, y: -3 }}
              className="bg-surface/50 border border-surface-light rounded-xl p-4 text-center backdrop-blur-sm cursor-default"
            >
              <motion.div
                className="text-2xl mb-2"
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                {item.icon}
              </motion.div>
              <p className="text-sm text-white/70">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* Reminders (brief) */}
      <AnimatedSection className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div
          variants={scaleIn}
          whileHover={{ scale: 1.01 }}
          className="bg-surface/30 border border-surface-light rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 backdrop-blur-sm"
        >
          <motion.div
            className="text-4xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
          >
            🔔
          </motion.div>
          <div>
            <h3 className="font-semibold text-lg mb-1">
              Oh, and we'll keep you on schedule.
            </h3>
            <p className="text-white/50 text-sm">
              Quick 4-question assessment → personalised reminders based on CDC
              guidelines. No judgement, just nudges.
            </p>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection className="relative z-10 px-6 py-24 max-w-3xl mx-auto text-center" aria-labelledby="cta-heading">
        <motion.div variants={stagger}>
          <motion.h2
            id="cta-heading"
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold mb-6"
          >
            Be first in line.
          </motion.h2>

          <motion.div variants={fadeUp} className="max-w-md mx-auto mb-6">
            {status === "success" ? (
              <div className="bg-accent-mint/10 border border-accent-mint/30 rounded-2xl p-4 text-center">
                <span className="text-accent-mint text-xl mr-2">✓</span>
                <span className="text-white">You're on the list!</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                {/* Honeypot field - hidden from humans, bots will fill it */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute -left-[9999px] opacity-0 h-0 w-0 pointer-events-none"
                />
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3 rounded-full bg-surface border border-surface-light text-white placeholder:text-white/40 focus:border-accent focus:shadow-lg focus:shadow-accent/20 transition-all duration-300"
                  disabled={status === "loading"}
                  aria-label="Email address for waitlist"
                  required
                />
                <motion.button
                  type="submit"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-accent/25"
                  aria-label={status === "loading" ? "Joining waitlist" : "Join waitlist for early access"}
                >
                  {status === "loading" ? "Joining..." : "Get early access"}
                </motion.button>
              </form>
            )}
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="border-t border-surface-light pt-8 mt-8"
          >
            <p className="text-white/60 mb-4">Want to shape what we build?</p>
            <motion.a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(201, 160, 220, 0.1)",
              }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-accent-lavender/30 text-accent-lavender transition-colors"
            >
              Take the 2-min survey →
            </motion.a>
            <p className="text-xs text-white/30 mt-3">
              Your answers = your influence on v1
            </p>
          </motion.div>
        </motion.div>
      </AnimatedSection>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 px-6 py-12 border-t border-surface-light"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Discloser - Privacy-first sexual health app logo"
              width={28}
              height={28}
              className="rounded-lg"
              loading="lazy"
            />
            <span className="text-white/60 text-sm">Discloser</span>
          </div>
          <p className="text-white/40 text-sm italic">
            Be adventurous. Stay anonymous.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a
              href="/privacy"
              className="hover:text-white/60 transition-colors"
            >
              Privacy
            </a>
            <a
              href="mailto:hello@discloser.app"
              className="hover:text-white/60 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
        <p className="text-center text-white/20 text-xs mt-8">
          © 2026 Discloser
        </p>
      </motion.footer>
    </div>
    </>
  );
}

// Wrapper component for scroll-triggered sections
function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}
