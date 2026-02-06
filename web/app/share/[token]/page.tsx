import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Metadata } from "next";

interface STIResult {
  name: string;
  status: string;
  result: string;
}

interface SharedResult extends STIResult {
  test_type: string;
  test_date: string;
  is_verified: boolean;
  show_name: boolean;
  display_name: string;
  is_valid: boolean;
  is_expired: boolean;
  is_over_limit: boolean;
}

// Prevent indexing of private share pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
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

function ExpiredPage({ isOverLimit }: { isOverLimit?: boolean }) {
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

function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center">
        <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Nothing here</h1>
        <p className="text-white/60">This link doesn't exist or got deleted.</p>
      </div>
    </PageWrapper>
  );
}

async function getSharedResult(token: string) {
  const { data, error } = await supabase.rpc("get_shared_result", { share_token: token });
  if (error || !data?.length) return null;
  return data[0];
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSharedResult(token);

  if (!data) {
    return <NotFoundPage />;
  }

  if (!data.is_valid) {
    return <ExpiredPage isOverLimit={data.is_over_limit} />;
  }

  const results = (data.sti_results || []) as STIResult[];
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const statusColor = (s: string) =>
    s === "negative" ? "text-accent-mint" : s === "positive" ? "text-danger" : "text-warning";
  const statusBg = (s: string) =>
    s === "negative" ? "bg-accent-mint/20" : s === "positive" ? "bg-danger/20" : "bg-warning/20";

  return (
    <PageWrapper>
      {/* Main Card */}
      <div className="bg-surface rounded-3xl border border-surface-light overflow-hidden">
        {/* Header */}
        <div className="text-center px-6 pt-8 pb-6">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{data.test_type}</h1>
          {data.show_name && data.display_name && (
            <p className="text-white/60 text-sm">Shared by {data.display_name}</p>
          )}
          <p className="text-white/40 text-sm mt-1">{formatDate(data.test_date)}</p>
        </div>

        {/* Results List */}
        <div className="px-6 pb-6">
          {results.length > 0 ? (
            <div className="bg-surface-light/50 rounded-2xl divide-y divide-surface-light">
              {results.map((sti, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-4">
                  <span className="font-medium text-white">{sti.name}</span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusBg(sti.status)} ${statusColor(sti.status)}`}>
                    {sti.result}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-6 rounded-2xl ${statusBg(data.status)}`}>
              <p className={`text-xl font-bold ${statusColor(data.status)}`}>
                {data.status === "negative" ? "All Clear ✓" : data.status === "positive" ? "Positive" : "Pending"}
              </p>
            </div>
          )}
        </div>

        {/* Verified Badge */}
        {data.is_verified && (
          <div className="border-t border-surface-light px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-accent-mint text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Lab verified. The real deal.</span>
            </div>
          </div>
        )}
      </div>

      {/* Branding Footer */}
      <div className="flex flex-col items-center justify-center gap-1 mt-8">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Image src="/logomark.png" alt="Discloser" width={20} height={20} />
          <span>Shared via Discloser</span>
        </div>
        <span className="text-white/25 text-xs">Share your status. Keep your name.</span>
      </div>
    </PageWrapper>
  );
}
