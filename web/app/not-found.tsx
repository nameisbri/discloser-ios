export default function NotFound() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
      <p className="text-gray-500 text-sm">This shared status is no longer available. The link may have expired or been revoked.</p>
    </div>
  );
}
