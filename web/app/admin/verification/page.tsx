import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import Image from "next/image";

// Prevent search engine indexing of admin pages
export const metadata: Metadata = {
  title: "Verification Analytics",
  robots: {
    index: false,
    follow: false,
  },
};

// --- Types -------------------------------------------------------------------

interface VerificationAnalytics {
  total_results: number;
  verified_count: number;
  level_distribution: Record<string, number>;
  avg_score: number | null;
  median_score: number | null;
  with_content_hash: number;
  results_last_30d: number;
  verified_last_30d: number;
  top_failed_checks: FailedCheck[];
}

interface FailedCheck {
  check_name: string;
  fail_count: number;
}

// --- Data fetching -----------------------------------------------------------

async function getAnalytics(token: string): Promise<VerificationAnalytics | null> {
  const { data, error } = await supabase.rpc("get_verification_analytics", {
    admin_token: token,
  });

  if (error) return null;
  return data as VerificationAnalytics;
}

// --- Helper components -------------------------------------------------------

/** Renders a labeled stat value inside a card. */
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface-light/50 rounded-2xl px-5 py-4">
      <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
    </div>
  );
}

/** Color mapping for each verification level. */
const LEVEL_COLORS: Record<string, string> = {
  high: "bg-accent-mint",
  moderate: "bg-accent-lavender",
  low: "bg-warning",
  unverified: "bg-white/20",
  no_signals: "bg-white/10",
  null: "bg-white/5",
};

const LEVEL_LABELS: Record<string, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
  unverified: "Unverified",
  no_signals: "No Signals",
  null: "Not Scored",
};

/** Renders a horizontal progress bar for a verification level. */
function LevelBar({ level, count, max }: { level: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const color = LEVEL_COLORS[level] || "bg-white/10";
  const label = LEVEL_LABELS[level] || level;

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/60 text-sm w-24 text-right shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-surface-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white text-sm font-medium w-16 shrink-0">{count} <span className="text-white/40">({pct}%)</span></span>
    </div>
  );
}

// --- Unauthorized page -------------------------------------------------------

function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        <div className="bg-surface rounded-3xl border border-surface-light p-8">
          <div className="w-16 h-16 bg-danger/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m-4.93-4.364A9 9 0 1121 12a9 9 0 01-15.93-.364z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">403 Forbidden</h1>
          <p className="text-white/50 text-sm">
            A valid admin token is required to access this page.
          </p>
        </div>
      </div>
    </main>
  );
}

// --- Page component ----------------------------------------------------------

export default async function VerificationAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === "string" ? resolvedParams.token : undefined;

  if (!token) {
    return <UnauthorizedPage />;
  }

  const analytics = await getAnalytics(token);

  if (!analytics) {
    return <UnauthorizedPage />;
  }

  const {
    total_results,
    verified_count,
    level_distribution,
    avg_score,
    median_score,
    with_content_hash,
    results_last_30d,
    verified_last_30d,
    top_failed_checks,
  } = analytics;

  const verifiedPct = total_results > 0 ? ((verified_count / total_results) * 100).toFixed(1) : "0";
  const dupCheckPct = total_results > 0 ? ((with_content_hash / total_results) * 100).toFixed(1) : "0";
  const verifiedLast30Pct = results_last_30d > 0 ? ((verified_last_30d / results_last_30d) * 100).toFixed(1) : "0";

  // Determine the maximum level count for scaling the progress bars
  const levelEntries = Object.entries(level_distribution || {});
  const maxLevelCount = Math.max(...levelEntries.map(([, c]) => c), 1);

  // Canonical level ordering
  const levelOrder = ["high", "moderate", "low", "unverified", "no_signals", "null"];
  const orderedLevels = levelOrder
    .filter((l) => level_distribution?.[l] !== undefined)
    .map((l) => ({ level: l, count: level_distribution[l] }));

  // Append any unexpected levels that may exist in the data
  const knownSet = new Set(levelOrder);
  levelEntries
    .filter(([l]) => !knownSet.has(l))
    .forEach(([l, c]) => orderedLevels.push({ level: l, count: c }));

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Verification Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Aggregate verification statistics — no PII exposed.</p>
        </div>

        {/* Overview stat cards */}
        <section className="grid grid-cols-2 gap-3 mb-8">
          <StatCard label="Total Results" value={total_results.toLocaleString()} />
          <StatCard label="Verified" value={`${verifiedPct}%`} sub={`${verified_count.toLocaleString()} of ${total_results.toLocaleString()}`} />
          <StatCard label="Avg Score" value={avg_score !== null ? avg_score : "--"} sub="out of 100" />
          <StatCard label="Median Score" value={median_score !== null ? median_score : "--"} sub="out of 100" />
        </section>

        {/* Level distribution */}
        <section className="bg-surface rounded-3xl border border-surface-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Level Distribution</h2>
          {orderedLevels.length > 0 ? (
            <div className="space-y-3">
              {orderedLevels.map(({ level, count }) => (
                <LevelBar key={level} level={level} count={count} max={maxLevelCount} />
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm">No level data available.</p>
          )}
        </section>

        {/* 30-day stats */}
        <section className="bg-surface rounded-3xl border border-surface-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Last 30 Days</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Results Uploaded" value={results_last_30d.toLocaleString()} />
            <StatCard label="Verified" value={`${verifiedLast30Pct}%`} sub={`${verified_last_30d.toLocaleString()} of ${results_last_30d.toLocaleString()}`} />
          </div>
        </section>

        {/* Duplicate detection */}
        <section className="bg-surface rounded-3xl border border-surface-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Duplicate Detection</h2>
          <StatCard label="With Content Hash" value={`${dupCheckPct}%`} sub={`${with_content_hash.toLocaleString()} of ${total_results.toLocaleString()} results`} />
        </section>

        {/* Top failed checks */}
        <section className="bg-surface rounded-3xl border border-surface-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Failed Checks</h2>
          {top_failed_checks && top_failed_checks.length > 0 ? (
            <div className="bg-surface-light/50 rounded-2xl divide-y divide-surface-light">
              {top_failed_checks.map((check, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-3">
                  <span className="text-white/80 text-sm font-medium">{check.check_name}</span>
                  <span className="text-white text-sm font-semibold">{check.fail_count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm">No failed checks recorded.</p>
          )}
        </section>

        {/* Branding footer */}
        <div className="flex flex-col items-center justify-center gap-1 mt-10">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Image src="/logomark.png" alt="Discloser" width={20} height={20} />
            <span>Discloser Admin</span>
          </div>
        </div>
      </div>
    </main>
  );
}
