import type { Metadata } from "next";
import {
  FileText,
  Smartphone,
  Upload,
  Clock,
  Link2,
  Lock,
  Eye,
  Trash2,
  Bell,
  CheckCircle,
  XCircle,
  Camera,
  ShieldCheck,
  Shield,
  Fingerprint,
  Star,
} from "lucide-react";

import ParallaxBlobs from "./components/ParallaxBlobs";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import AnimatedHeader from "./components/AnimatedHeader";
import HeroContent from "./components/HeroContent";
import WaitlistForm from "./components/WaitlistForm";
import AnimatedSection from "./components/AnimatedSection";
import AnimatedCard from "./components/AnimatedCard";
import AnimatedFooter from "./components/AnimatedFooter";
import SurveyButton from "./components/SurveyButton";
import FAQSection from "./components/FAQSection";
import { ScrollDepthTracker } from "./components/ScrollDepthTracker";
import { SURVEY_URL } from "./components/constants";
import { scaleIn } from "./components/animations";

export const metadata: Metadata = {
  title:
    "Discloser: Share Your STI Status Anonymously | Privacy-First Sexual Health App",
  description:
    "Share STI test results through secure, anonymous links without exposing your name or personal information. Free privacy-first iOS app with time-limited sharing, end-to-end encryption, and CDC-based testing reminders. Join the waitlist.",
  alternates: {
    canonical: "https://discloser.app",
  },
};

const faqItems = [
  {
    question: "How does Discloser protect my identity?",
    answer:
      "When you share your test results through Discloser, recipients only see your testing status and date. Never your name, date of birth, health card number, or any other personally identifiable information. Your full lab documents stay private on your device.",
  },
  {
    question: "Is Discloser free?",
    answer:
      "Yes. Discloser is completely free at launch. Core features like uploading results, sharing secure links, and setting testing reminders will always be free. Optional premium features are planned for the future, but privacy will never have a price tag.",
  },
  {
    question: "How does document verification work?",
    answer:
      "Discloser runs each document through 7 verification checks: recognized lab, health card number, accession ID, name match, date validity, document structure, and cross-signal agreement. The results are scored from 0 to 100 and assigned a confidence level (Verified with high confidence, Verified, or Unverified). You and recipients can see exactly which checks passed and why.",
  },
  {
    question: "How do expiring links work?",
    answer:
      "Every share link you create has customizable expiry settings. You choose the time limit (from 1 hour to 30 days) and the maximum number of views. Once either limit is reached, the link automatically deactivates and recipients can no longer access your results.",
  },
  {
    question: "Is my health data sold to third parties?",
    answer:
      "Absolutely not. Discloser will never sell, share, or monetize your health data. Your test results are encrypted and stored securely. We don't run ads, and we don't have data-sharing partnerships. Your data is yours. Period.",
  },
  {
    question: "What STIs does Discloser support?",
    answer:
      "Discloser supports all standard STI panel tests including HIV, chlamydia, gonorrhea, syphilis, hepatitis B and C, herpes (HSV-1 and HSV-2), HPV, trichomoniasis, and mycoplasma. If your lab tests for it, Discloser can parse and display it.",
  },
  {
    question: "Is Discloser available on Android?",
    answer:
      "Discloser is launching first on iOS. An Android version is planned based on user demand and feedback from our initial launch. Join the waitlist to stay updated.",
  },
  {
    question: "What happens when I delete my account?",
    answer:
      "When you delete your account, all of your data (test results, share links, profile information) is permanently removed from our servers. Active share links are immediately deactivated. This action is irreversible.",
  },
];

export default function Home() {
  return (
    <>
      {/* Structured Data: MobileApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            name: "Discloser",
            description:
              "Privacy-first iOS app for sharing STI test results anonymously through secure, time-limited links. Upload results, set expiry and view limits, and share without revealing your identity.",
            url: "https://discloser.app",
            applicationCategory: "HealthApplication",
            operatingSystem: "iOS",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/PreOrder",
            },
            featureList: [
              "Anonymous STI status sharing via secure links",
              "End-to-end encryption for test results",
              "Time-limited and view-limited sharing links",
              "Personalized STI testing reminders based on CDC guidelines",
              "Photo upload or file import for test results",
              "Revocable access to shared results",
              "No personal information exposed to recipients",
              "Automated document verification with confidence scoring",
            ],
            screenshot: "https://discloser.app/og-image.png",
            author: {
              "@type": "Organization",
              name: "Discloser",
              url: "https://discloser.app",
            },
          }),
        }}
      />

      {/* Structured Data: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Discloser",
            url: "https://discloser.app",
            logo: "https://discloser.app/logo.png",
            description:
              "Discloser builds privacy-first tools for sexual health, starting with anonymous STI status sharing.",
            contactPoint: {
              "@type": "ContactPoint",
              email: "hello@discloser.app",
              contactType: "customer support",
            },
          }),
        }}
      />

      {/* Structured Data: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />

      <SmoothScrollProvider>
        <ScrollDepthTracker />
        {/* TODO: track cta_clicked when App Store links are added */}
        <ParallaxBlobs />
        <AnimatedHeader />

        {/* Hero */}
        <main className="relative z-10 px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
          <HeroContent>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight animate-fade-up">
              Share Your STI Status Anonymously
              <br />
              <span className="bg-gradient-to-r from-accent via-accent-coral to-accent-purple bg-clip-text text-transparent inline-block animate-gradient">
                Keep your name.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/75 max-w-xl mx-auto mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Being responsible shouldn&apos;t cost you your privacy.
            </p>
            <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto mb-10 animate-fade-up leading-relaxed" style={{ animationDelay: "0.2s" }}>
              Discloser is a privacy-first iOS app that lets you share verified
              STI test results anonymously. Upload your lab documents, set expiry
              and view limits, and share a secure link or QR code. Recipients see
              your status, not your name, date of birth, or any personally
              identifiable information.
            </p>
          </HeroContent>

          {/* Email signup */}
          <div className="max-w-md mx-auto">
            <WaitlistForm variant="hero" />
          </div>
        </main>

        {/* Problem section */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-4xl mx-auto"
          aria-labelledby="problem-heading"
        >
          <div className="text-center mb-12">
            <h2
              id="problem-heading"
              className="text-2xl sm:text-4xl font-bold mb-3 leading-tight"
            >
              The Problem With Sharing STI Test Results
            </h2>
            <p className="text-white/70">
              Right now, proving you&apos;re negative means...
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <AnimatedCard
              variants={scaleIn}
              className="bg-surface/50 border border-surface-light rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Showing your whole life
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Full name, date of birth, health card number, address... all
                visible to someone who might not even remember your name tomorrow.
              </p>
              <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg overflow-hidden">
                <div className="text-xs text-danger/80 font-mono">
                  <span className="bg-danger/30 px-1">Jane Smith</span> ·{" "}
                  <span className="bg-danger/30 px-1">1990-03-15</span> ·{" "}
                  <span className="bg-danger/30 px-1">HC# 1234-567-890</span>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard
              variants={scaleIn}
              className="bg-surface/50 border border-surface-light rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mb-4">
                <Smartphone
                  className="w-6 h-6 text-accent"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Screenshots that live forever
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                That photo of your test results? It&apos;s sitting in their camera
                roll. Backed up to iCloud. Forever.
              </p>
              <div className="mt-4 p-3 bg-surface-light rounded-lg text-xs text-white/65 flex items-center gap-2">
                <Camera
                  className="w-4 h-4 text-white/65 shrink-0"
                  aria-hidden="true"
                />{" "}
                Saved to Photos · Synced to iCloud · Shared to...?
              </div>
            </AnimatedCard>
          </div>

          <p className="text-center text-white/75 mt-10">
            Being responsible shouldn&apos;t cost you your privacy.
          </p>
        </AnimatedSection>

        {/* Solution / Before-After */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-4xl mx-auto"
          aria-labelledby="solution-heading"
        >
          <AnimatedCard
            variants={scaleIn}
            hoverY={0}
            className="bg-gradient-to-br from-surface to-surface-light border border-surface-light rounded-3xl p-8 sm:p-12 backdrop-blur-sm"
          >
            <h2
              id="solution-heading"
              className="text-2xl sm:text-4xl font-bold mb-4 text-center leading-tight"
            >
              How Discloser Protects Your Identity
            </h2>
            <p className="text-white/70 text-center mb-8">
              Share proof, not your life story.
            </p>

            <div className="grid sm:grid-cols-2 gap-8 items-center">
              {/* Before */}
              <div className="space-y-4 opacity-50">
                <p className="text-sm text-white/65 uppercase tracking-wide">
                  Without Discloser
                </p>
                <div className="space-y-2 text-white/75">
                  {[
                    "Full lab document visible",
                    "Name, DOB, HC# exposed",
                    "Screenshot stays forever",
                    "Awkward photo swap",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <XCircle
                        className="w-4 h-4 text-danger shrink-0"
                        aria-hidden="true"
                      />{" "}
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* After */}
              <div className="space-y-4">
                <p className="text-sm text-accent uppercase tracking-wide">
                  With Discloser
                </p>
                <div className="bg-background/50 rounded-2xl p-6 border border-accent/20 shadow-lg shadow-accent/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent-mint/20 flex items-center justify-center">
                      <CheckCircle
                        className="w-5 h-5 text-accent-mint"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">All Clear</p>
                      <p className="text-xs text-white/65">
                        Tested Jan 3, 2026
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-white/65 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" aria-hidden="true" /> Link
                      expires in 24h
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" aria-hidden="true" /> 3 views
                      left
                    </span>
                  </div>
                </div>
                <p className="text-sm text-white/70">
                  They see your status. Not your life story.
                </p>
              </div>
            </div>

            <p className="text-sm text-white/60 text-center mt-8 max-w-2xl mx-auto leading-relaxed">
              Unlike partner notification services that alert contacts about
              potential exposure, Discloser lets you proactively share verified
              proof of your testing status, putting you in control of the
              conversation.
            </p>
          </AnimatedCard>
        </AnimatedSection>

        {/* Privacy */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-4xl mx-auto"
          aria-labelledby="privacy-heading"
        >
          <div className="text-center mb-10">
            <h2
              id="privacy-heading"
              className="text-xl sm:text-2xl font-bold mb-3"
            >
              Built-In Privacy Controls
            </h2>
            <p className="text-white/70">
              Privacy that&apos;s not just theatre. No data selling. No social
              features. No traces.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: (
                  <Lock className="w-5 h-5 text-accent" aria-hidden="true" />
                ),
                label: "Your data stays yours",
              },
              {
                icon: (
                  <Clock className="w-5 h-5 text-accent" aria-hidden="true" />
                ),
                label: "Links auto-expire",
              },
              {
                icon: (
                  <Eye className="w-5 h-5 text-accent" aria-hidden="true" />
                ),
                label: "Set view limits",
              },
              {
                icon: (
                  <Trash2 className="w-5 h-5 text-accent" aria-hidden="true" />
                ),
                label: "Delete anytime",
              },
            ].map((item) => (
              <AnimatedCard
                key={item.label}
                variants={scaleIn}
                hoverY={-3}
                className="bg-surface/50 border border-surface-light rounded-xl p-4 text-center backdrop-blur-sm cursor-default"
              >
                <div className="mb-2 flex justify-center">{item.icon}</div>
                <p className="text-sm text-white/70">{item.label}</p>
              </AnimatedCard>
            ))}
          </div>
        </AnimatedSection>

        {/* How it works */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-4xl mx-auto"
          aria-labelledby="how-it-works-heading"
        >
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-bold mb-3 text-center"
          >
            How Anonymous STI Sharing Works
          </h2>
          <p className="text-white/70 text-center mb-12">
            Three taps. Total control.
          </p>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <Upload
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "Upload",
                desc: "Take a photo of your results or import from files",
              },
              {
                icon: (
                  <Clock
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "Set limits",
                desc: "Choose expiry time (1 hour to 30 days) and view limits",
              },
              {
                icon: (
                  <Link2
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "Share",
                desc: "Send a link or QR code. They see status, not your data",
              },
            ].map((step) => (
              <AnimatedCard
                key={step.title}
                variants={scaleIn}
                hoverY={-8}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-surface-light flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-white/70">{step.desc}</p>
              </AnimatedCard>
            ))}
          </div>

          <p className="text-sm text-white/60 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            Discloser uses multi-signal document verification to extract and
            validate your test results from lab documents. Each result receives a
            confidence score based on 7 checks, then is shared through
            time-limited, view-limited links that automatically expire, giving
            you full control over who sees what, and for how long.
          </p>
        </AnimatedSection>

        {/* Verification */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-4xl mx-auto"
          aria-labelledby="verification-heading"
        >
          <div className="text-center mb-12">
            <h2
              id="verification-heading"
              className="text-2xl sm:text-3xl font-bold mb-3"
            >
              Verified Results. Real Trust.
            </h2>
            <p className="text-white/70">
              Recipients see proof, not promises.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <ShieldCheck
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "Multi-Signal Verification",
                desc: "Each result is checked against 7 signals: recognized lab, health card number, accession ID, name match, date validity, document structure, and cross-signal agreement.",
              },
              {
                icon: (
                  <Star
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "Confidence Levels",
                desc: "Recipients see a clear confidence badge (Verified with high confidence, Verified, or Unverified) so they know exactly how much trust to place in a result.",
              },
              {
                icon: (
                  <Fingerprint
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "No Manual Review",
                desc: "Verification is instant and automated. No human ever reviews your sensitive health documents. Your data stays between you and the person you choose to share with.",
              },
            ].map((item) => (
              <AnimatedCard
                key={item.title}
                variants={scaleIn}
                className="bg-surface/50 border border-surface-light rounded-2xl p-6 backdrop-blur-sm text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {item.desc}
                </p>
              </AnimatedCard>
            ))}
          </div>

          <p className="text-sm text-white/60 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            Verification checks are transparent. You see exactly which signals
            passed or didn&apos;t, and why.
          </p>
        </AnimatedSection>

        {/* Reminders */}
        <AnimatedSection className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
          <AnimatedCard
            variants={scaleIn}
            hoverY={0}
            className="bg-surface/30 border border-surface-light rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 backdrop-blur-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center shrink-0">
              <Bell className="w-7 h-7 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                STI Testing Reminders Based on CDC Guidelines
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Quick 4-question assessment → personalised reminders based on CDC
                guidelines. No judgement, just nudges to keep you on schedule.
              </p>
            </div>
          </AnimatedCard>
        </AnimatedSection>

        {/* Trust & Security */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-4xl mx-auto"
          aria-labelledby="trust-heading"
        >
          <div className="text-center mb-10">
            <h2
              id="trust-heading"
              className="text-xl sm:text-2xl font-bold mb-3"
            >
              Security You Can Trust
            </h2>
            <p className="text-white/70">
              Built on trust, not promises. Security and compliance aren&apos;t
              features we bolt on later.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <Lock className="w-6 h-6 text-accent" aria-hidden="true" />
                ),
                title: "End-to-end encryption",
                desc: "Your test results are encrypted before they leave your device and stay encrypted in transit and at rest. Not even Discloser's team can access your health data.",
              },
              {
                icon: (
                  <ShieldCheck
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "PIPEDA-aligned practices",
                desc: "Discloser follows Canadian privacy law (PIPEDA) standards for handling sensitive personal health information, including data minimization and purpose limitation.",
              },
              {
                icon: (
                  <Shield
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                ),
                title: "CDC-aligned guidelines",
                desc: "Testing reminder schedules are based on the CDC's STI screening recommendations, personalized to your situation through a brief confidential assessment.",
              },
            ].map((item) => (
              <AnimatedCard
                key={item.title}
                variants={scaleIn}
                className="bg-surface/50 border border-surface-light rounded-2xl p-6 backdrop-blur-sm text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {item.desc}
                </p>
              </AnimatedCard>
            ))}
          </div>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-3xl mx-auto"
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="text-2xl sm:text-3xl font-bold mb-8 text-center"
          >
            Frequently Asked Questions About Discloser
          </h2>
          <FAQSection items={faqItems} />
        </AnimatedSection>

        {/* Final CTA */}
        <AnimatedSection
          className="relative z-10 px-6 py-24 max-w-3xl mx-auto text-center"
          aria-labelledby="cta-heading"
        >
          <h2
            id="cta-heading"
            className="text-3xl sm:text-4xl font-bold mb-6"
          >
            Get Early Access to Discloser
          </h2>
          <p className="text-white/70 mb-6">Be first in line.</p>

          <div className="max-w-md mx-auto mb-6">
            <WaitlistForm variant="cta" />
          </div>

          <div className="border-t border-surface-light pt-8 mt-8">
            <p className="text-white/75 mb-4">Want to shape what we build?</p>
            <SurveyButton href={SURVEY_URL}>
              Take the 2-min survey →
            </SurveyButton>
            <p className="text-xs text-white/55 mt-3">
              Your answers = your influence on v1
            </p>
          </div>
        </AnimatedSection>

        <AnimatedFooter />
      </SmoothScrollProvider>
    </>
  );
}
