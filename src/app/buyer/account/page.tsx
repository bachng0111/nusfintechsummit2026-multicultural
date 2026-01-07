'use client';

import { useState } from 'react';
import AccountInfo from '@/components/buyer/AccountInfo';
import { useWallet } from '@/components/XRPLProvider';

interface Token {
  id: string;
  metadata: {
    volumeTonsCO2: number;
  };
  retired?: boolean;
}

export default function BuyerAccountPage() {
  const { balance } = useWallet();
  const [ownedTokens, setOwnedTokens] = useState<Token[]>([
    { id: 'token-1', metadata: { volumeTonsCO2: 10 } },
    { id: 'token-2', metadata: { volumeTonsCO2: 5 } },
  ]);
  const [retiredTokens, setRetiredTokens] = useState<Token[]>([]);

  const totalVolume = ownedTokens.reduce((sum, t) => sum + t.metadata.volumeTonsCO2, 0) +
                      retiredTokens.reduce((sum, t) => sum + t.metadata.volumeTonsCO2, 0);

  // Example function to "retire" a token
  const retireToken = (tokenId: string) => {
    const token = ownedTokens.find((t) => t.id === tokenId);
    if (!token) return;
    setOwnedTokens(ownedTokens.filter((t) => t.id !== tokenId));
    setRetiredTokens([...retiredTokens, { ...token, retired: true }]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-600">My Account</h1>

      <AccountInfo
        ownedCount={ownedTokens.length}
        retiredCount={retiredTokens.length}
        totalVolume={totalVolume}
        rlusdBalance={balance ? parseFloat(balance) : 0}
      />

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Owned Tokens</h2>
        {ownedTokens.length === 0 ? (
          <p>No tokens owned yet</p>
        ) : (
          <ul className="space-y-2">
            {ownedTokens.map((t) => (
              <li key={t.id} className="flex justify-between items-center p-2 border rounded">
                <span>Token ID: {t.id} | Volume: {t.metadata.volumeTonsCO2} tons CO₂</span>
                <button
                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => retireToken(t.id)}
                >
                  Retire
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Retired Tokens</h2>
        {retiredTokens.length === 0 ? (
          <p>No tokens retired yet</p>
        ) : (
          <ul className="space-y-2">
            {retiredTokens.map((t) => (
              <li key={t.id} className="p-2 border rounded bg-gray-100">
                Token ID: {t.id} | Volume: {t.metadata.volumeTonsCO2} tons CO₂
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
