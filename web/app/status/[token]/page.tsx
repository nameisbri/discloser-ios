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

function ExpiredPage({ isOverLimit }: { isOverLimit?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
      <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center backdrop-blur-sm">
        <div className="w-16 h-16 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          {isOverLimit ? "View Limit Reached" : "Link Expired"}
        </h1>
        <p className="text-white/60 text-sm">
          {isOverLimit
            ? "This shared status has reached its maximum view limit."
            : "This shared status is no longer available. The link may have expired or been revoked."}
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

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
      <div className="bg-surface rounded-3xl border border-surface-light p-8 text-center backdrop-blur-sm">
        <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Link Not Found</h1>
        <p className="text-white/60 text-sm">This link doesn't exist or has been deleted.</p>
      </div>
      <div className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs">
        <Image src="/logo.png" alt="Discloser" width={16} height={16} className="rounded" />
        <span>Discloser</span>
      </div>
      </div>
    </div>
  );
}

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSharedStatus(token);

  // Handle not found
  if (!data) {
    return <NotFoundPage />;
  }

  // Handle expired or over limit
  if (!data.is_valid) {
    return <ExpiredPage isOverLimit={data.is_over_limit} />;
  }

  const statuses = data.status_snapshot as STIStatus[];
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">STI Status</h1>
          {data.show_name && data.display_name && (
            <p className="text-white/60 text-sm mt-1">Shared by {data.display_name}</p>
          )}
        </div>

        {/* Status Items */}
        <div className="space-y-1">
          {statuses.map((sti, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-surface-light last:border-0">
              <div>
                <p className="font-semibold text-white">{sti.name}</p>
                <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
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
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBg(sti.status)} ${statusColor(sti.status)}`}>
                {sti.result}
              </span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-6 pt-4 border-t border-surface-light">
          <span className="text-accent-mint">✓ Verified</span> = from a recognized Canadian lab
        </p>
      </div>

      {/* Branding */}
      <div className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs">
        <Image src="/logo.png" alt="Discloser" width={16} height={16} className="rounded" />
        <span>Shared via Discloser</span>
      </div>
      </div>
    </div>
  );
}
