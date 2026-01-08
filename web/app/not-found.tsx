import Image from "next/image";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center">
          <div className="w-16 h-16 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
          <p className="text-white/60">
            This page doesn't exist or the link may have expired.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-white/40 text-sm">
          <Image src="/logo.png" alt="Discloser" width={20} height={20} className="rounded" />
          <span>Discloser</span>
        </div>
      </div>
    </main>
  );
}
