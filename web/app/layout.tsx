import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discloser — Share your status. Keep your name.",
  description: "The smart way to share STI results without exposing your identity. Privacy-first sexual health for grown-ups.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Discloser — Share your status. Keep your name.",
    description: "The smart way to share STI results without exposing your identity.",
    type: "website",
    url: "https://discloser.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discloser — Share your status. Keep your name.",
    description: "The smart way to share STI results without exposing your identity.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative">{children}</body>
    </html>
  );
}
