import Image from "next/image";

const CTA_URL =
  "https://discloser.app/?utm_source=share_page&utm_medium=cta&utm_campaign=viral_loop";

export function SharePageCTA() {
  return (
    <div className="mt-6 bg-surface rounded-2xl border border-surface-light p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Image src="/logomark.png" alt="Discloser" width={24} height={24} />
        <span className="text-white font-semibold text-base">Discloser</span>
      </div>
      <p className="text-white/70 text-sm leading-relaxed mb-4">
        Share your status. Keep your name.
        <br />
        <span className="text-white/50">
          Private, simple, stigma-free STI disclosure.
        </span>
      </p>
      <a
        href={CTA_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-ph-capture-attribute-cta_location="share_page"
        className="inline-block px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent/90 transition-colors"
      >
        Learn More
      </a>
    </div>
  );
}
