import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Metadata } from "next";
import { METHOD_LABELS } from "@/app/components/share/constants";
import { ExpiredPage, NotFoundPage } from "@/app/components/share/SharePageLayout";
import { formatDate, statusColor, statusBg } from "@/app/components/share/helpers";
import { VerificationExplainer } from "@/app/components/share/VerificationExplainer";

// Prevent indexing of private status pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface STIStatus {
  name: string;
  status: string;
  result: string;
  testDate: string;
  isVerified: boolean;
  verificationLevel?: string | null;
  isKnownCondition?: boolean;
  managementMethods?: string[];
}

async function getSharedStatus(token: string) {
  const { data, error } = await supabase.rpc("get_shared_status", { share_token: token });
  if (error || !data?.length) return null;
  return data[0];
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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-surface rounded-3xl border border-surface-light overflow-hidden">
          {/* Header */}
          <div className="text-center px-6 pt-8 pb-6">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                        {/* Three-tier badge: high → "Verified ★", moderate → "Verified", below → no badge */}
                        {sti.isVerified && (
                          <span className="text-accent-mint flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {sti.verificationLevel === "high" ? "Verified ★" : "Verified"}
                          </span>
                        )}
                        {(() => {
                          const d = new Date(sti.testDate);
                          const twoYearsAgo = new Date();
                          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                          return d < twoYearsAgo ? (
                            <span className="text-yellow-400/60">Over 2 years old</span>
                          ) : null;
                        })()}
                      </div>
                      {sti.isKnownCondition && sti.managementMethods && sti.managementMethods.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sti.managementMethods.map((methodId) => (
                            <span
                              key={methodId}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-lavender/10 text-accent-lavender"
                            >
                              {METHOD_LABELS[methodId] || methodId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${statusBg(sti.status, sti.isKnownCondition)} ${statusColor(sti.status, sti.isKnownCondition)}`}>
                      {sti.isKnownCondition ? "Managed" : sti.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Note — expandable verification explainer */}
          <VerificationExplainer isVerified={statuses.some((s) => s.isVerified)} />
        </div>

        {/* Branding Footer */}
        <div className="flex flex-col items-center justify-center gap-1 mt-8">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Image src="/logomark.png" alt="Discloser" width={20} height={20} />
            <span>Shared via Discloser</span>
          </div>
          <span className="text-white/25 text-xs">Share your status. Keep your name.</span>
        </div>
      </div>
    </main>
  );
}
