import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Metadata } from "next";
import { METHOD_LABELS } from "@/app/components/share/constants";
import { KnownCondition, matchesKnownCondition } from "@/app/components/share/matching";
import { ExpiredPage, NotFoundPage } from "@/app/components/share/SharePageLayout";
import { formatDate, statusColor, statusBg } from "@/app/components/share/helpers";
import { VerificationExplainer } from "@/app/components/share/VerificationExplainer";
import { SharePageTracker } from "@/app/components/share/SharePageTracker";

interface STIResult {
  name: string;
  status: string;
  result: string;
}

interface SharedResult extends STIResult {
  test_type: string;
  test_date: string;
  is_verified: boolean;
  verification_level: string | null;
  show_name: boolean;
  display_name: string;
  is_valid: boolean;
  is_expired: boolean;
  is_over_limit: boolean;
  known_conditions?: KnownCondition[];
  created_at: string;
  note: string | null;
  label: string | null;
}

// Prevent indexing of private share pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

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
    return (
      <>
        <SharePageTracker
          event="share_link_expired"
          properties={{
            expiry_reason: data.is_over_limit ? "views" : "time",
            total_views: 0,
          }}
        />
        <ExpiredPage isOverLimit={data.is_over_limit} />
      </>
    );
  }

  const results = (data.sti_results || []) as STIResult[];
  const knownConditions = (data.known_conditions || []) as KnownCondition[];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <SharePageTracker
        event="share_link_opened"
        properties={{
          link_age_hours: Math.round(
            (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60)
          ),
          view_number: 0,
        }}
      />
      <div className="w-full max-w-md">
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
            {data.created_at && (
              <p className="text-white/40 text-sm mt-1">Shared on {formatDate(data.created_at)}</p>
            )}
            {/* Three-tier verification badge: high → "Verified — High Confidence", moderate → "Verified", below → no badge */}
            {data.is_verified && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-accent-mint/10">
                <svg className="w-3.5 h-3.5 text-accent-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-accent-mint text-xs font-semibold">
                  {data.verification_level === "high" ? "Verified — High Confidence" : "Verified"}
                </span>
              </div>
            )}
            {(() => {
              const d = new Date(data.test_date);
              const twoYearsAgo = new Date();
              twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
              return d < twoYearsAgo ? (
                <p className="text-yellow-400/70 text-xs mt-2">This result is over 2 years old</p>
              ) : null;
            })()}
          </div>

          {/* Results List */}
          <div className="px-6 pb-6">
            {results.length > 0 ? (
              <div className="bg-surface-light/50 rounded-2xl divide-y divide-surface-light">
                {results.map((sti, i) => {
                  const matchedKc = matchesKnownCondition(sti.name, knownConditions);
                  const isKnown = !!matchedKc;
                  const methods = matchedKc?.management_methods || [];
                  return (
                    <div key={i} className="px-4 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-medium text-white truncate">{sti.name}</p>
                          {isKnown && methods.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {methods.map((methodId) => (
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
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${statusBg(sti.status, isKnown)} ${statusColor(sti.status, isKnown)}`}>
                          {isKnown ? "Managed" : sti.result}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-6 rounded-2xl ${statusBg(data.status)}`}>
                <p className={`text-xl font-bold ${statusColor(data.status)}`}>
                  {data.status === "negative" ? "All Clear" : data.status === "positive" ? "Positive" : "Pending"}
                </p>
              </div>
            )}
          </div>

          {/* Footer Note — expandable verification explainer */}
          <VerificationExplainer isVerified={data.is_verified} />
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
