'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        {/* Title */}
        <h1 className="text-5xl font-bold text-carbon-800 mb-4">
          🌿 CarbonLedger
        </h1>
        <p className="text-xl text-carbon-600 mb-8">
          Transparent RWA Marketplace for Carbon Credits on XRPL
        </p>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/issuer"
            className="px-8 py-4 bg-carbon-600 text-white rounded-xl font-semibold hover:bg-carbon-700 transition-colors shadow-lg"
          >
            🏭 Issuer Portal
          </Link>
          <Link
            href="/marketplace"
            className="px-8 py-4 bg-white text-carbon-700 rounded-xl font-semibold hover:bg-carbon-50 transition-colors shadow-lg border border-carbon-200"
          >
            🛒 Marketplace
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 max-w-2xl mx-auto text-left bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-3">How it works:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Get a test wallet funded with XRP on Devnet</li>
            <li>Purchase verified carbon credits</li>
            <li>Track your carbon offset portfolio</li>
            <li>Retire credits to offset emissions and receive certificates</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
