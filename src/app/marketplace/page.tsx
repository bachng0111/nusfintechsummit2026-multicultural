'use client';

import React, { useState, useEffect } from 'react';
import TokenCard from '../../components/marketplace/TokenCard';
import { Token } from '../../components/marketplace/TokenCard';
import { useWallet } from '@/components/buyer/BuyerXRPLProvider';
import { useRouter } from 'next/navigation';
import BuyMPTButton from '../../components/marketplace/BuyButton'; // new button

export default function MarketplacePage() {
  const router = useRouter();
  const { isConnected, address, getWallet, getClient } = useWallet();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [buying, setBuying] = useState(false);

  // Load XRPL client & wallet for the modal
  const [client, setClient] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);

  // For demo, map token ID → mptIssuanceId
  const tokenMPTMap: Record<string, string> = {
    CC001: 'insert issuance id',
    CC002: '0028D357C396CB5E1AF33362CD014A48A74F1F5E183FF728',
    CC003: 'insert issuance id',
  };

  const handleTokenPurchase = async (token: Token) => {
    if (!isConnected) {
      localStorage.setItem(
        'post_login_intent',
        JSON.stringify({
          action: 'BUY_TOKEN',
          tokenId: token.id,
        })
      );
      router.push('/');
      return;
    }

    setSelectedToken(token);

    // Load XRPL client & wallet
    try {
      const xrplClient = await getClient();
      const xrplWallet = getWallet();
      setClient(xrplClient);
      setWallet(xrplWallet);
    } catch (err) {
      console.error('Failed to load XRPL client/wallet:', err);
    }
  };

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

      {/* Modal */}
      {selectedToken && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">{selectedToken.name}</h3>
            <p className="text-gray-600 mb-2">Price: {selectedToken.price} RLUSD</p>
            <p className="text-gray-500 mb-4">{selectedToken.description}</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedToken(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>

              {/* Only render the button if client & wallet are ready */}
              {client && wallet && (
                <BuyMPTButton
                  client={client}
                  wallet={wallet}
                  mptIssuanceId={tokenMPTMap[selectedToken.id]}
                  onSuccess={() => {
                    alert('You are now authorized to hold this MPT!');
                    setSelectedToken(null);
                  }}
                  onError={(err) => alert('Authorization failed: ' + err.message)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Marketplace */}
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
                onBuy={handleTokenPurchase}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
