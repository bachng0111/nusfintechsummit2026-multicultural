import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-carbon-800 mb-4">
          🌿 CarbonLedger
        </h1>
        <p className="text-xl text-carbon-600 mb-8">
          Transparent RWA Marketplace for Carbon Credits on XRPL
        </p>
        
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
      </div>
    </main>
  )
}
