import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discloser - Shared Status",
  description: "View shared STI test status",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4">
        {children}
      </body>
    </html>
  );
}
