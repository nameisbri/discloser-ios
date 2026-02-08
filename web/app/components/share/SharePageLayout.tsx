import Image from "next/image";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {children}
        <div className="flex items-center justify-center gap-2 mt-8 text-white/40 text-sm">
          <Image src="/logomark.png" alt="Discloser" width={20} height={20} />
          <span>Discloser</span>
        </div>
      </div>
    </main>
  );
}

export function ExpiredPage({ isOverLimit }: { isOverLimit?: boolean }) {
  return (
    <PageWrapper>
      <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center">
        <div className="w-16 h-16 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          {isOverLimit ? "That's a wrap" : "This link vanished"}
        </h1>
        <p className="text-white/60">
          {isOverLimit
            ? "Max views reached. Ask for a fresh link if you need one."
            : "It expired or got revoked. Privacy in action."}
        </p>
      </div>
    </PageWrapper>
  );
}

export function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center">
        <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Nothing here</h1>
        <p className="text-white/60">This link doesn&apos;t exist or got deleted.</p>
      </div>
    </PageWrapper>
  );
}
