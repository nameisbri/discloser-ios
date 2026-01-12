import "./globals.css";
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://discloser.app"),
  title: {
    default: "Discloser — Share Your STI Status Anonymously | Privacy-First Sexual Health",
    template: "%s | Discloser",
  },
  description: "Share your STI test results securely without exposing your identity. Privacy-first app for anonymous status sharing, testing reminders, and sexual health management. Get early access to the smart way to share your status.",
  keywords: [
    "STI test results",
    "sexual health",
    "privacy-first",
    "anonymous sharing",
    "STI status",
    "test results sharing",
    "sexual health app",
    "STI testing",
    "privacy protection",
    "secure sharing",
    "health privacy",
    "STI disclosure",
    "anonymous health",
    "sexual wellness",
    "health data privacy",
  ],
  authors: [{ name: "Discloser" }],
  creator: "Discloser",
  publisher: "Discloser",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://discloser.app",
    siteName: "Discloser",
    title: "Discloser — Share Your STI Status Anonymously | Privacy-First Sexual Health",
    description: "The smart way to share STI test results without exposing your identity. Privacy-first sexual health app with secure, anonymous status sharing and testing reminders.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Discloser - Share your status. Keep your name.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discloser — Share Your STI Status Anonymously",
    description: "The smart way to share STI test results without exposing your identity. Privacy-first sexual health for grown-ups.",
    images: ["/og-image.png"],
    creator: "@discloserapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://discloser.app",
  },
  category: "Health",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://us.i.posthog.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
        />
        
        {/* Google Analytics - Load after page is interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YJ5F2H69N3"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YJ5F2H69N3');
          `}
        </Script>

        {/* PostHog - Load after page is interactive */}
        <Script id="posthog" strategy="lazyOnload">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_BhzgLkcdUrWhbGLRZis6ZAVtmcsSpcmi7e6BpeUjX7y', {api_host: 'https://us.i.posthog.com', person_profiles: 'identified_only'});
          `}
        </Script>

        {/* Microsoft Clarity - Load after page is interactive */}
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "uyybtzby70");
          `}
        </Script>
      </head>
      <body className="relative">{children}</body>
    </html>
  );
}
