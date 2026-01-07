import Image from "next/image";

export default function Home() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <Image
          src="/logo.png"
          alt="Discloser"
          width={80}
          height={80}
          className="mx-auto rounded-2xl mb-6"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Discloser</h1>
        <p className="text-gray-500 mb-6">Your sexual health, your control.</p>

        <div className="space-y-3 text-left text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary">✓</span>
            <span>Store STI test results securely</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary">✓</span>
            <span>Share with time-limited links</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary">✓</span>
            <span>AI-powered document scanning</span>
          </div>
        </div>
      </div>
    </div>
  );
}
