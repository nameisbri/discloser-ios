import { supabase } from "@/lib/supabase";

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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        {isOverLimit ? "View Limit Reached" : "Link Expired"}
      </h1>
      <p className="text-gray-500 text-sm">
        {isOverLimit
          ? "This shared status has reached its maximum view limit."
          : "This shared status is no longer available. The link may have expired or been revoked."}
      </p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Link Not Found</h1>
      <p className="text-gray-500 text-sm">This link doesn't exist or has been deleted.</p>
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
  const statusColor = (s: string) => s === "negative" ? "text-success" : s === "positive" ? "text-danger" : "text-warning";
  const statusBg = (s: string) => s === "negative" ? "bg-success-light" : s === "positive" ? "bg-danger-light" : "bg-warning-light";

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">STI Status</h1>
        {data.show_name && data.display_name && (
          <p className="text-gray-500 text-sm">Shared by {data.display_name}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">via Discloser</p>
      </div>

      <div className="space-y-3">
        {statuses.map((sti, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="font-semibold text-gray-900">{sti.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDate(sti.testDate)}</span>
                {sti.isVerified && <span className="text-success" title="From a recognized Canadian lab">✓ Verified</span>}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBg(sti.status)} ${statusColor(sti.status)}`}>
              {sti.result}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-400 text-xs mt-6">
        <span className="text-success">✓ Verified</span> = from a recognized Canadian lab
      </p>
    </div>
  );
}
