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
        try {
          window.posthog?.capture("waitlist_signup", {
            referral_source: new URLSearchParams(window.location.search).get("utm_source") || document.referrer || null,
            page_time_seconds: Math.round((Date.now() - loadTime) / 1000),
            variant: variant,
          });
        } catch {
          // Analytics failure must never affect form behavior
        }
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
        <div className="bg-success/10 border border-success/30 rounded-2xl p-4 text-center">
          <CheckCircle className="w-5 h-5 text-success inline mr-2" aria-hidden="true" />
          <span className="text-text-primary">You&apos;re on the list!</span>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }}
        className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const }}
          className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CheckCircle className="w-8 h-8 text-success" aria-label="Success" />
          </motion.div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-semibold text-lg text-text-primary mb-1"
        >
          You&apos;re on the list!
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-text-secondary text-sm"
        >
          We&apos;ll let you know when Discloser is ready.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-text-tertiary text-xs mt-3"
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
        className="flex flex-col gap-3 mb-4"
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
          className="flex-1 px-5 py-3 rounded-full bg-white border border-text-tertiary/30 text-text-primary placeholder:text-text-tertiary focus:border-burgundy focus:shadow-lg focus:shadow-burgundy/10 transition-all duration-300"
          disabled={status === "loading"}
          aria-label="Email address for waitlist"
          required
        />
        <motion.button
          type="submit"
          disabled={status === "loading"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-3 rounded-full font-semibold bg-coral hover:bg-coral-hover text-white transition-colors disabled:opacity-50 shadow-lg shadow-coral/20"
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
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-3">
              No spam, ever. Just launch updates you can unsubscribe from anytime.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <Lock className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                Encrypted
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <ShieldCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                Privacy-first
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <CheckCircle className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                Free at launch
              </span>
            </div>
            <p className="text-sm text-text-tertiary font-medium">
              Be among the first to try it
            </p>
          </div>
        </>
      )}
    </>
  );
}
