import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Metadata } from "next";

interface STIResult {
  name: string;
  status: string;
  result: string;
}

interface KnownCondition {
  condition: string;
  added_at: string;
  notes?: string;
  management_methods?: string[];
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
  known_conditions?: KnownCondition[];
}

const METHOD_LABELS: Record<string, string> = {
  daily_antivirals: "Daily antivirals",
  antiviral_as_needed: "Antivirals as needed",
  supplements: "Supplements",
  prep: "PrEP",
  art_treatment: "ART treatment",
  undetectable: "Undetectable viral load",
  antiviral_treatment: "Antiviral treatment",
  liver_monitoring: "Liver function monitoring",
  vaccinated: "Vaccinated",
  cured: "Completed treatment / cured",
  regular_screening: "Regular screening",
  barriers: "Barrier use",
  regular_monitoring: "Regular monitoring",
};

// Prevent indexing of private share pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function matchesKnownCondition(stiName: string, knownConditions: KnownCondition[]): KnownCondition | undefined {
  const name = stiName.toLowerCase();
  return knownConditions.find((kc) => {
    const cond = kc.condition.toLowerCase();
    if (cond === name) return true;
    if ((cond.includes("hsv-1") || cond.includes("hsv1")) &&
        (name.includes("hsv-1") || name.includes("hsv1") || name.includes("herpes simplex virus 1") || name.includes("simplex 1"))) return true;
    if ((cond.includes("hsv-2") || cond.includes("hsv2")) &&
        (name.includes("hsv-2") || name.includes("hsv2") || name.includes("herpes simplex virus 2") || name.includes("simplex 2"))) return true;
    if (cond.includes("hiv") && name.includes("hiv")) return true;
    if ((cond.includes("hepatitis b") || cond.includes("hep b") || cond.includes("hbv")) &&
        (name.includes("hepatitis b") || name.includes("hep b") || name.includes("hbv"))) return true;
    if ((cond.includes("hepatitis c") || cond.includes("hep c") || cond.includes("hcv")) &&
        (name.includes("hepatitis c") || name.includes("hep c") || name.includes("hcv"))) return true;
    // HPV variations
    if ((cond.includes("hpv") || cond.includes("papilloma")) &&
        (name.includes("hpv") || name.includes("papilloma") || name.includes("human papilloma"))) return true;
    return false;
  });
}

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
        <p className="text-white/60">This link doesn&apos;t exist or got deleted.</p>
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
  const knownConditions = (data.known_conditions || []) as KnownCondition[];
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const statusColor = (s: string, isKnown?: boolean) =>
    isKnown ? "text-accent-lavender" : s === "negative" ? "text-accent-mint" : s === "positive" ? "text-danger" : "text-warning";
  const statusBg = (s: string, isKnown?: boolean) =>
    isKnown ? "bg-accent-lavender/20" : s === "negative" ? "bg-accent-mint/20" : s === "positive" ? "bg-danger/20" : "bg-warning/20";

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

        {/* Verified Badge */}
        {data.is_verified && (
          <div className="border-t border-surface-light px-6 py-4">
            <p className="text-center text-white/40 text-xs">
              <span className="text-accent-mint">&#10003; Verified</span> = the real deal from a Canadian lab
            </p>
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
