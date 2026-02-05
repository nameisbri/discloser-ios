"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Lock, ShieldCheck } from "lucide-react";

interface WaitlistFormProps {
  variant?: "hero" | "cta";
}

export default function WaitlistForm({ variant = "hero" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadTime] = useState(() => Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (honeypot) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: honeypot, loadTime }),
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

  if (status === "success") {
    if (variant === "cta") {
      return (
        <div className="bg-accent-mint/10 border border-accent-mint/30 rounded-2xl p-4 text-center">
          <CheckCircle className="w-5 h-5 text-accent-mint inline mr-2" aria-hidden="true" />
          <span className="text-white">You&apos;re on the list!</span>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
        className="bg-accent-mint/10 border border-accent-mint/30 rounded-2xl p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }}
          className="w-16 h-16 rounded-full bg-accent-mint/20 flex items-center justify-center mx-auto mb-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CheckCircle className="w-8 h-8 text-accent-mint" aria-label="Success" />
          </motion.div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-semibold text-lg text-white mb-1"
        >
          You&apos;re on the list!
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/75 text-sm"
        >
          We&apos;ll let you know when Discloser is ready.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/65 text-xs mt-3"
        >
          Check your inbox for next steps.
        </motion.p>
      </motion.div>
    );
  }

  const buttonText = variant === "cta" ? "Get private beta access" : "Join the waitlist";
  const buttonAriaLabel = status === "loading"
    ? "Joining waitlist"
    : variant === "cta"
      ? "Get private beta access"
      : "Join waitlist";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 mb-4"
      >
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
          className="flex-1 px-5 py-3 rounded-full bg-surface border border-surface-light text-white placeholder:text-white/50 focus:border-accent focus:shadow-lg focus:shadow-accent/20 transition-all duration-300"
          disabled={status === "loading"}
          aria-label="Email address for waitlist"
          required
        />
        <motion.button
          type="submit"
          disabled={status === "loading"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full sm:w-auto px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-accent/25 ${
            variant === "cta" ? "px-8 whitespace-nowrap" : ""
          }`}
          aria-label={buttonAriaLabel}
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner" aria-hidden="true" />
              Joining...
            </span>
          ) : (
            buttonText
          )}
        </motion.button>
      </form>
      {variant === "hero" && (
        <>
          <p className="text-xs text-white/70 max-w-sm mx-auto mb-3">
            No spam, ever. Just launch updates you can unsubscribe from anytime.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-white/65">
              <Lock className="w-3.5 h-3.5 text-accent-mint" aria-hidden="true" />
              Encrypted
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/65">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-mint" aria-hidden="true" />
              Privacy-first
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/65">
              <CheckCircle className="w-3.5 h-3.5 text-accent-mint" aria-hidden="true" />
              Free at launch
            </span>
          </div>
          <div className="inline-flex items-center gap-2 bg-surface/50 border border-surface-light rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" aria-hidden="true" />
            <p className="text-sm text-white/65 font-medium">
              Be among the first to try it
            </p>
          </div>
        </>
      )}
    </>
  );
}
