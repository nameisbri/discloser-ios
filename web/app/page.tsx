import type { Metadata } from "next";
import {
  FileText,
  Smartphone,
  Clock,
  Lock,
  Eye,
  Trash2,
  CheckCircle,
  Camera,
  ShieldCheck,
  Shield,
  Bell,
} from "lucide-react";

import ShareCardMockup from "./components/ShareCardMockup";
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
        <AnimatedHeader />

        {/* Hero */}
        <main className="relative z-10 px-6 pt-16 pb-24 max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <HeroContent>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight mb-6 leading-tight animate-fade-up">
                Share Your STI Status Anonymously
                <br />
                <span className="text-burgundy inline-block">
                  Keep your name.
                </span>
              </h1>
              <p className="text-lg text-text-secondary mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                Being responsible shouldn&apos;t cost you your privacy.
              </p>
              <p className="text-sm text-text-secondary max-w-lg mb-8 animate-fade-up leading-relaxed" style={{ animationDelay: "0.2s" }}>
                Upload your lab documents, set expiry and view limits, and
                share a secure link. Recipients see your status, not your
                name or any personally identifiable information.
              </p>
              <div className="max-w-md animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <WaitlistForm variant="hero" />
              </div>
            </HeroContent>

            {/* Right — share card mockup */}
            <div className="hidden sm:block">
              <ShareCardMockup />
            </div>
          </div>

          {/* Mobile share card — shown below form on small screens */}
          <div className="sm:hidden mt-12">
            <ShareCardMockup />
          </div>
        </main>

        {/* Problem section */}
        <div className="bg-bg-dark">
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-text-primary-dark"
          aria-labelledby="problem-heading"
        >
          <div className="text-center mb-12">
            <h2
              id="problem-heading"
              className="text-2xl sm:text-4xl font-bold font-display mb-3 leading-tight"
            >
              The Problem With Sharing STI Test Results
            </h2>
            <p className="text-text-secondary-dark">
              Right now, proving you&apos;re negative means...
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <AnimatedCard
              variants={scaleIn}
              className="bg-surface border border-surface-light rounded-2xl p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-burgundy-light" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Showing your whole life
              </h3>
              <p className="text-text-secondary-dark text-sm leading-relaxed">
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
              className="bg-surface border border-surface-light rounded-2xl p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mb-4">
                <Smartphone
                  className="w-6 h-6 text-burgundy-light"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Screenshots that live forever
              </h3>
              <p className="text-text-secondary-dark text-sm leading-relaxed">
                That photo of your test results? It&apos;s sitting in their camera
                roll. Backed up to iCloud. Forever.
              </p>
              <div className="mt-4 p-3 bg-surface-light rounded-lg text-xs text-text-secondary-dark flex items-center gap-2">
                <Camera
                  className="w-4 h-4 text-text-secondary-dark shrink-0"
                  aria-hidden="true"
                />{" "}
                Saved to Photos · Synced to iCloud · Shared to...?
              </div>
            </AnimatedCard>
          </div>

        </AnimatedSection>
        </div>

        {/* Privacy & Security */}
        <div className="bg-bg-dark">
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-5xl mx-auto text-text-primary-dark"
          aria-labelledby="privacy-heading"
        >
          <div className="grid sm:grid-cols-5 gap-12 sm:gap-16">
            {/* Left — privacy features */}
            <div className="sm:col-span-3">
              <h2
                id="privacy-heading"
                className="text-2xl sm:text-3xl font-bold font-display mb-4"
              >
                Your Privacy. Non-Negotiable.
              </h2>
              <p className="text-text-secondary-dark mb-8 leading-relaxed">
                No data selling. No social features. No traces. Your health
                data is yours — period.
              </p>

              <div className="space-y-5">
                {[
                  { icon: <Lock className="w-5 h-5 text-burgundy-light" aria-hidden="true" />, text: "Your data stays yours — encrypted at rest, in transit, and on-device" },
                  { icon: <Clock className="w-5 h-5 text-burgundy-light" aria-hidden="true" />, text: "Links auto-expire on your schedule (1 hour to 30 days)" },
                  { icon: <Eye className="w-5 h-5 text-burgundy-light" aria-hidden="true" />, text: "Set view limits — revoke access anytime" },
                  { icon: <Trash2 className="w-5 h-5 text-burgundy-light" aria-hidden="true" />, text: "Delete your data permanently, whenever you want" },
                  { icon: <Bell className="w-5 h-5 text-burgundy-light" aria-hidden="true" />, text: "CDC-based testing reminders — personalised, no judgement" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <p className="text-text-secondary-dark text-sm leading-relaxed pt-1.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — security credentials */}
            <div className="sm:col-span-2 space-y-8">
              {[
                {
                  icon: <Lock className="w-5 h-5 text-burgundy-light" aria-hidden="true" />,
                  title: "End-to-end encryption",
                  desc: "Results encrypted before they leave your device. Not even our team can read them.",
                },
                {
                  icon: <ShieldCheck className="w-5 h-5 text-burgundy-light" aria-hidden="true" />,
                  title: "PIPEDA-aligned",
                  desc: "Canadian privacy law standards for health data — data minimization and purpose limitation.",
                },
                {
                  icon: <Shield className="w-5 h-5 text-burgundy-light" aria-hidden="true" />,
                  title: "CDC guidelines",
                  desc: "Testing reminders based on CDC screening recommendations, personalised to you.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {item.icon}
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-text-secondary-dark text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
        </div>

        {/* How it works */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-5xl mx-auto text-text-primary"
          aria-labelledby="how-it-works-heading"
        >
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-bold font-display mb-3 text-center"
          >
            How Anonymous STI Sharing Works
          </h2>
          <p className="text-text-secondary text-center mb-16">
            Three taps. Total control.
          </p>

          {/* Numbered steps */}
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-4 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-text-tertiary/30" aria-hidden="true" />

            {[
              {
                num: "01",
                title: "Upload",
                desc: "Take a photo of your results or import from files",
              },
              {
                num: "02",
                title: "Set limits",
                desc: "Choose expiry time and maximum views",
              },
              {
                num: "03",
                title: "Share",
                desc: "Send a link or QR code — they see status, not your data",
              },
            ].map((step) => (
              <div key={step.num} className="text-center relative">
                <span className="font-display font-bold text-3xl text-burgundy mb-3 block">
                  {step.num}
                </span>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Verification band */}
          <div className="mt-16 bg-bg-dark rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="shrink-0">
                <p className="font-display font-bold text-text-primary-dark text-lg">
                  7 verification checks
                </p>
                <p className="text-text-secondary-dark text-sm">
                  Each result scored 0–100 with a confidence badge
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Lab", "HC#", "Accession", "Name", "Date", "Structure", "Agreement"].map((check) => (
                  <span
                    key={check}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-surface text-text-secondary-dark border border-surface-light"
                  >
                    <CheckCircle className="w-3 h-3 text-success" aria-hidden="true" />
                    {check}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>


        {/* FAQ */}
        <AnimatedSection
          className="relative z-10 px-6 py-20 max-w-3xl mx-auto text-text-primary"
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="text-2xl sm:text-3xl font-bold font-display mb-8 text-center"
          >
            Frequently Asked Questions About Discloser
          </h2>
          <FAQSection items={faqItems} />
        </AnimatedSection>

        {/* Final CTA */}
        <AnimatedSection
          className="relative z-10 px-6 py-24 max-w-3xl mx-auto text-center text-text-primary"
          aria-labelledby="cta-heading"
        >
          <h2
            id="cta-heading"
            className="text-3xl sm:text-4xl font-bold font-display mb-6"
          >
            Get Early Access to Discloser
          </h2>
          <p className="text-text-secondary mb-6">Be first in line.</p>

          <div className="max-w-md mx-auto mb-6">
            <WaitlistForm variant="cta" />
          </div>

          <div className="border-t border-text-tertiary/20 pt-8 mt-8">
            <p className="text-text-secondary mb-4">Want to shape what we build?</p>
            <SurveyButton href={SURVEY_URL}>
              Take the 2-min survey →
            </SurveyButton>
            <p className="text-xs text-text-tertiary mt-3">
              Your answers = your influence on v1
            </p>
          </div>
        </AnimatedSection>

        <AnimatedFooter />
      </SmoothScrollProvider>
    </>
  );
}
