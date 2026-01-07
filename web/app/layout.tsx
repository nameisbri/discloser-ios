import "./globals.css";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Discloser - Shared Status",
  description: "View shared STI test status securely",
  openGraph: {
    title: "Discloser - Shared Status",
    description: "View shared STI test status securely",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex justify-center">
          <div className="flex items-center gap-2 opacity-90">
            <Image src="/logo.png" alt="Discloser" width={32} height={32} className="rounded-lg" />
            <span className="text-white/80 font-semibold text-sm">Discloser</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center p-4 pb-8">
          {children}
        </main>

        {/* Footer CTA */}
        <footer className="p-6 text-center">
          <p className="text-white/50 text-xs mb-3">Your sexual health, your control.</p>
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/80 text-sm px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Get Discloser
          </a>
        </footer>
      </body>
    </html>
  );
}
