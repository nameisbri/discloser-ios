export default function Home() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Discloser</h1>
      <p className="text-gray-500 mb-6">Your sexual health, your control.</p>
      <p className="text-gray-400 text-sm">Download the app to manage and share your STI test results securely.</p>
    </div>
  );
}
