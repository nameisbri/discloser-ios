import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Discloser protects your privacy and handles your personal health information securely.",
  alternates: {
    canonical: "https://discloser.app/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1520] to-[#2d1f2f]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-pink max-w-none">
          <p className="text-white/60 mb-8">Last Updated: January 21, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-medium text-white/90 mb-3">Information You Provide</h3>
            <ul className="list-disc pl-6 text-white/70 space-y-2 mb-4">
              <li><strong className="text-white/90">Authentication Data:</strong> Email address (when using Magic Link), Apple ID/Google ID (when using social login)</li>
              <li><strong className="text-white/90">Profile Information:</strong> Name, alias, date of birth, pronouns (optional)</li>
              <li><strong className="text-white/90">Health Information:</strong> STI test results, test dates, known conditions</li>
              <li><strong className="text-white/90">Usage Data:</strong> Testing reminders, share links created</li>
            </ul>

            <h3 className="text-xl font-medium text-white/90 mb-3">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li><strong className="text-white/90">Device Information:</strong> Device type, operating system version (for app functionality)</li>
              <li><strong className="text-white/90">Usage Analytics:</strong> Anonymous usage statistics to improve the app</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>To provide and improve the app</li>
              <li>To manage your account and authentication</li>
              <li>To enable secure sharing of test results</li>
              <li>To send push notifications for testing reminders</li>
              <li>To analyze usage patterns (anonymized)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Storage & Security</h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li><strong className="text-white/90">Storage:</strong> Your data is stored securely on Supabase (encrypted at rest)</li>
              <li><strong className="text-white/90">Access:</strong> Only you can access your data (row-level security)</li>
              <li><strong className="text-white/90">Sharing:</strong> When you share a test result, you control whether to show your name, how long the link is valid, and how many times the link can be viewed</li>
              <li><strong className="text-white/90">Deletion:</strong> You can delete your data at any time through the app</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p className="text-white/70 mb-4">We use the following services to provide the app:</p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li><strong className="text-white/90">Supabase:</strong> Backend services (auth, database, storage)</li>
              <li><strong className="text-white/90">Expo:</strong> App framework and build services</li>
              <li><strong className="text-white/90">Google Cloud Vision:</strong> Document OCR (for test result parsing)</li>
              <li><strong className="text-white/90">OpenRouter:</strong> AI services (for document parsing)</li>
              <li><strong className="text-white/90">Apple/Google:</strong> Authentication services</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li><strong className="text-white/90">Access:</strong> View all data stored in the app</li>
              <li><strong className="text-white/90">Correction:</strong> Edit your profile information</li>
              <li><strong className="text-white/90">Deletion:</strong> Delete your account and all associated data</li>
              <li><strong className="text-white/90">Opt-out:</strong> Disable push notifications in Settings</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Children&apos;s Privacy</h2>
            <p className="text-white/70">
              Discloser is not intended for children under 17. We do not knowingly collect personal information from children under 17.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li><strong className="text-white/90">Your Data:</strong> Retained until you delete your account</li>
              <li><strong className="text-white/90">Share Links:</strong> Automatically expire based on your settings</li>
              <li><strong className="text-white/90">Analytics:</strong> Retained anonymously for app improvement</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p className="text-white/70">
              For questions about this Privacy Policy or your data:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2 mt-2">
              <li>Email: <a href="mailto:hello@discloser.app" className="text-pink-400 hover:text-pink-300">hello@discloser.app</a></li>
              <li>Website: <a href="https://discloser.app" className="text-pink-400 hover:text-pink-300">https://discloser.app</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <a href="mailto:hello@discloser.app" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </main>
  );
}
