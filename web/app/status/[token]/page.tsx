import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface STIStatus {
  name: string;
  status: string;
  result: string;
  testDate: string;
  isVerified: boolean;
}

async function getSharedStatus(token: string) {
  const { data, error } = await supabase.rpc("get_shared_status", { share_token: token });
  if (error || !data?.length) return null;
  return data[0];
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {children}
        <div className="flex items-center justify-center gap-2 mt-8 text-white/40 text-sm">
          <Image src="/logo.png" alt="Discloser" width={20} height={20} className="rounded" />
          <span>Discloser</span>
        </div>
      </div>
    </main>
  );
}

function ExpiredPage({ isOverLimit }: { isOverLimit?: boolean }) {
  return (
    <PageWrapper>
      <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center">
        <div className="w-16 h-16 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center">
        <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Nothing here</h1>
        <p className="text-white/60">This link doesn't exist or got deleted.</p>
      </div>
    </PageWrapper>
  );
}

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSharedStatus(token);

  if (!data) {
    return <NotFoundPage />;
  }

  if (!data.is_valid) {
    return <ExpiredPage isOverLimit={data.is_over_limit} />;
  }

  const statuses = data.status_snapshot as STIStatus[];
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const statusColor = (s: string) =>
    s === "negative" ? "text-accent-mint" : s === "positive" ? "text-danger" : "text-warning";
  const statusBg = (s: string) =>
    s === "negative" ? "bg-accent-mint/20" : s === "positive" ? "bg-danger/20" : "bg-warning/20";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-surface rounded-3xl border border-surface-light overflow-hidden">
          {/* Header */}
          <div className="text-center px-6 pt-8 pb-6">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">STI Status</h1>
            {data.show_name && data.display_name && (
              <p className="text-white/60 text-sm">Shared by {data.display_name}</p>
            )}
          </div>

          {/* Status Items */}
          <div className="px-6 pb-6">
            <div className="bg-surface-light/50 rounded-2xl divide-y divide-surface-light">
              {statuses.map((sti, i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-white truncate">{sti.name}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                        <span>{formatDate(sti.testDate)}</span>
                        {sti.isVerified && (
                          <span className="text-accent-mint flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${statusBg(sti.status)} ${statusColor(sti.status)}`}>
                      {sti.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-surface-light px-6 py-4">
            <p className="text-center text-white/40 text-xs">
              <span className="text-accent-mint">✓ Verified</span> = the real deal from a Canadian lab
            </p>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="flex flex-col items-center justify-center gap-1 mt-8">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Image src="/logo.png" alt="Discloser" width={20} height={20} className="rounded" />
            <span>Shared via Discloser</span>
          </div>
          <span className="text-white/25 text-xs">Be adventurous. Stay anonymous.</span>
        </div>
      </div>
    </main>
  );
}
