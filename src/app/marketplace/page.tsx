'use client';

import React, { useState, useEffect } from 'react';
import TokenCard from '../../components/marketplace/TokenCard';
import { useWallet } from '../../components/XRPLProvider';

export default function MarketplacePage() {
  const { isConnected } = useWallet();
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    setTokens([
      {
        id: 'CC001',
        name: 'Reforestation Carbon Credit',
        price: '50',
        amount: 1,
        description: 'Verified carbon offset from reforestation project',
        project: 'Amazon Rainforest Initiative',
        vintage: '2024',
        certification: 'Verra VCS',
      },
      {
        id: 'CC002',
        name: 'Renewable Energy Credit',
        price: '75',
        amount: 1,
        description: 'Solar energy carbon offset credit',
        project: 'Solar Farm TX-012',
        vintage: '2024',
        certification: 'Gold Standard',
      },
      {
        id: 'CC003',
        name: 'Wind Power Credit',
        price: '65',
        amount: 1,
        description: 'Wind energy carbon offset credit',
        project: 'Offshore Wind Project',
        vintage: '2025',
        certification: 'ACR',
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Carbon Credit Marketplace</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Carbon Credits</h2>

        {tokens.length === 0 ? (
          <p className="text-gray-600">No tokens available yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                onBuy={(token) => {
                  if (!isConnected) {
                    alert('Please connect your wallet first!');
                    return;
                  }
                  console.log('Buying token:', token);
                  // Next step: call XRPL transaction here
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
