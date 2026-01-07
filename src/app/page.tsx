'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/XRPLProvider';
import Link from 'next/link';
import { ShoppingCart, Factory, Leaf, CheckCircle, Lock, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { isConnected } = useWallet();
  const router = useRouter();

  // Handle post-login redirects
  useEffect(() => {
    if (!isConnected) return;

    const intentRaw = localStorage.getItem('post_login_intent');
    if (!intentRaw) return;

    const intent = JSON.parse(intentRaw);
    localStorage.removeItem('post_login_intent');

    if (intent.action === 'BUY_TOKEN') {
      router.push(`/marketplace/buy/${intent.tokenId}`);
    }
  }, [isConnected, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <div className="mb-8">
          <Leaf className="w-20 h-20 mx-auto text-green-600 mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            🌿 CarbonLedger
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transparent Real-World Asset Marketplace for Carbon Credits on XRPL
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white text-lg rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Browse Marketplace
          </Link>
          <Link
            href="/issuer"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-700 text-lg rounded-xl font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl border-2 border-green-200 transform hover:-translate-y-0.5"
          >
            <Factory className="w-5 h-5 mr-2" />
            Issuer Portal
          </Link>
        </div>

        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="max-w-2xl mx-auto mb-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Connect your wallet in the top-right to start purchasing and managing carbon credits.
            </p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          How CarbonLedger Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              Purchase Carbon Credits
            </h3>
            <p className="text-gray-600">
              Browse verified carbon offset projects and purchase tokenized credits using RLUSD on the XRPL blockchain.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              Track Your Portfolio
            </h3>
            <p className="text-gray-600">
              Monitor your carbon credit holdings and see your total environmental impact in real-time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              Retire & Certify
            </h3>
            <p className="text-gray-600">
              Retire credits to offset emissions and receive verifiable on-chain certificates proving your climate action.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Why XRPL for Carbon Credits?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <Lock className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Transparent & Immutable</h3>
                <p className="text-green-50">
                  Every transaction is recorded on the blockchain, preventing double-counting and fraud.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Fast & Low-Cost</h3>
                <p className="text-green-50">
                  XRPL enables instant settlement with minimal transaction fees.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Verifiable Impact</h3>
                <p className="text-green-50">
                  Cryptographic proof of carbon offset with permanent on-chain records.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Leaf className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Real-World Assets</h3>
                <p className="text-green-50">
                  Each token represents actual verified carbon reduction projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Getting Started (Devnet)
          </h2>
          
          <ol className="space-y-4 text-gray-700">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <strong>Connect your wallet</strong> - Click "Connect Wallet" in the top-right to get a funded test wallet on Devnet
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <strong>Browse the marketplace</strong> - View available carbon credit tokens from verified projects
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <strong>Purchase credits</strong> - Buy tokens using RLUSD (testnet stablecoin)
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div>
                <strong>Retire & certify</strong> - Permanently retire tokens to offset emissions and receive on-chain certificates
              </div>
            </li>
          </ol>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Note:</strong> This is running on XRPL Devnet. All tokens and transactions are for testing only and have no real-world value.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}