import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for using the Discloser app. Read about your rights and responsibilities.",
  alternates: {
    canonical: "https://discloser.app/terms",
  },
};

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

        <div className="prose prose-invert prose-pink max-w-none">
          <p className="text-white/60 mb-8">Last Updated: January 21, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/70">
              By downloading and using Discloser, you agree to these Terms of Service. If you do not agree to these terms, please do not use the app.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Use of the App</h2>
            <p className="text-white/70">
              <strong className="text-white/90">Discloser is for informational purposes only</strong> and does not constitute medical advice. The app is designed to help you manage and share your STI test results securely.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>You are responsible for the accuracy of information you provide</li>
              <li>You must be at least 17 years old to use this app</li>
              <li>You must not use the app for illegal purposes</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must not share your login credentials with others</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Health Information Disclaimer</h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>Test results should be verified with your healthcare provider</li>
              <li>Discloser is not a substitute for professional medical advice</li>
              <li>We make no representations about the accuracy of test results</li>
              <li>Always consult a healthcare professional for medical decisions</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Privacy and Data</h2>
            <p className="text-white/70">
              Your use of Discloser is also governed by our{" "}
              <Link href="/privacy" className="text-pink-400 hover:text-pink-300">
                Privacy Policy
              </Link>
              . Please review it to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Sharing Features</h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>Share links you create are your responsibility</li>
              <li>You control who receives your share links</li>
              <li>We are not responsible for unauthorized access to shared links</li>
              <li>Share links expire based on your settings</li>
              <li>You can delete share links at any time</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p className="text-white/70">
              The Discloser app, including its design, features, and content, is owned by Discloser and protected by intellectual property laws. You may not copy, modify, or distribute any part of the app without permission.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-white/70">
              Discloser is provided &quot;as is&quot; without warranties of any kind, express or implied. We are not liable for any damages arising from your use of the app, including but not limited to direct, indirect, incidental, or consequential damages.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
            <p className="text-white/70">
              We reserve the right to suspend or terminate your access to Discloser at any time, for any reason, without notice. You may also delete your account at any time through the app settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
            <p className="text-white/70">
              We may update these Terms from time to time. We will notify you of significant changes through the app or via email. Continued use of the app after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law</h2>
            <p className="text-white/70">
              These Terms are governed by the laws of Canada. Any disputes will be resolved in the courts of Ontario, Canada.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="text-white/70">
              For questions about these Terms:
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
