import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center backdrop-blur-sm">
          <div className="w-16 h-16 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Link Expired</h1>
          <p className="text-white/60 text-sm">
            This shared status is no longer available. The link may have expired or been revoked.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs">
          <Image src="/logo.png" alt="Discloser" width={16} height={16} className="rounded" />
          <span>Discloser</span>
        </div>
      </div>
    </div>
  );
}
