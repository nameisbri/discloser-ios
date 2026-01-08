import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";

interface STIResult {
  name: string;
  status: string;
  result: string;
}

async function getSharedResult(token: string) {
  // Increment view count
  await supabase.rpc("increment_share_view", { share_token: token });

  const { data, error } = await supabase.rpc("get_shared_result", { share_token: token });
  if (error || !data?.length) return null;
  return data[0];
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSharedResult(token);

  if (!data) notFound();

  const results = (data.sti_results || []) as STIResult[];
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  const statusColor = (s: string) => 
    s === "negative" ? "text-accent-mint" : s === "positive" ? "text-danger" : "text-warning";
  const statusBg = (s: string) => 
    s === "negative" ? "bg-accent-mint/15" : s === "positive" ? "bg-danger/15" : "bg-warning/15";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-surface rounded-3xl border border-surface-light p-6 backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">{data.test_type}</h1>
          {data.show_name && data.display_name && (
            <p className="text-white/60 text-sm mt-1">Shared by {data.display_name}</p>
          )}
          <p className="text-white/40 text-xs mt-1">{formatDate(data.test_date)}</p>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-1">
            {results.map((sti, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-surface-light last:border-0">
                <p className="font-semibold text-white">{sti.name}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBg(sti.status)} ${statusColor(sti.status)}`}>
                  {sti.result}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-4 rounded-xl ${statusBg(data.status)}`}>
            <p className={`text-lg font-bold ${statusColor(data.status)}`}>
              {data.status === "negative" ? "All Clear ✓" : data.status === "positive" ? "Positive" : "Pending"}
            </p>
          </div>
        )}

        {/* Verified Badge */}
        {data.is_verified && (
          <div className="flex items-center justify-center gap-2 text-accent-mint text-sm mt-6 pt-4 border-t border-surface-light">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Verified from a recognized lab</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs">
        <Image src="/logo.png" alt="Discloser" width={16} height={16} className="rounded" />
        <span>Shared via Discloser</span>
      </div>
      </div>
    </div>
  );
}
