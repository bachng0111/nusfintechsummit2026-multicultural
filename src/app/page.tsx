'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/XRPLProvider';
import * as xrpl from 'xrpl';

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
    <div className="p-8 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Connect Wallet (Devnet)</h1>

      <button
        onClick={handleCreateWallet}
        disabled={isConnecting}
        className="w-full py-3 bg-blue-600 text-white rounded-lg"
      >
        {isConnecting ? 'Creating Wallet...' : 'Create Test Wallet'}
      </button>
      <p className="text-xs text-gray-500">
        Devnet only. Do NOT use real wallets.
      </p>
    </div>
  );
}
