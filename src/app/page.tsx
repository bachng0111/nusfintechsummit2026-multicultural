'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/XRPLProvider';
import * as xrpl from 'xrpl';
import Link from 'next/link';

export default function HomePage() {
  const { isConnected, connectNewWallet, connectFromSeed, isConnecting } = useWallet();
  const [seed, setSeed] = useState('');
  const router = useRouter();

  // Redirect if already connected
  useEffect(() => {
    if (isConnected) {
      router.push('/buyer/account');
    }
  }, [isConnected, router]);

  const handleCreateWallet = async () => {
    try {
      // Generate locally to show seed in console
      const testWallet = xrpl.Wallet.generate();
      console.log('💡 Devnet Wallet Seed (keep private!):', testWallet.seed);
      console.log('Classic Address:', testWallet.classicAddress);

      // Use your XRPLProvider method to actually create/connect wallet
      await connectNewWallet();

      // After connection, redirect
      router.push('/buyer/account');
    } catch (err) {
      console.error('Failed to create wallet:', err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-8 bg-gradient-to-br from-green-50 to-blue-50 space-y-12">
      {/* ======================
          TOP: CarbonLedger Intro
      ====================== */}
      <div className="text-center w-full max-w-4xl">
        <h1 className="text-5xl font-bold text-carbon-800 mb-4">
          🌿 CarbonLedger
        </h1>
        <p className="text-xl text-carbon-600 mb-8">
          Transparent RWA Marketplace for Carbon Credits on XRPL
        </p>

        <div className="flex gap-4 justify-center mb-12">
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

        <div className="max-w-2xl mx-auto text-left bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-3">How it works:</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Get a test wallet funded with XRP on Devnet</li>
            <li>Purchase verified carbon credits</li>
            <li>Track your carbon offset portfolio</li>
            <li>Retire credits to offset emissions and receive certificates</li>
          </ul>
        </div>
      </div>

      {/* ======================
          BOTTOM: Wallet Connect Section
      ====================== */}
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200 space-y-6">
        <h2 className="text-2xl font-bold text-center">Connect Wallet (Devnet)</h2>

        {/* Create Wallet */}
        <button
          onClick={handleCreateWallet}
          disabled={isConnecting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          {isConnecting ? 'Creating Wallet...' : 'Create Test Wallet'}
        </button>

        {/* Login with Seed */}
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Enter Devnet seed (sXXXX...)"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <button
            onClick={() => connectFromSeed(seed)}
            disabled={!seed || isConnecting}
            className="w-full py-3 bg-green-600 text-white rounded-lg"
          >
            Login with Existing Wallet
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Devnet only. Do NOT use real wallets.
        </p>
      </div>
    </main>
  );
}
