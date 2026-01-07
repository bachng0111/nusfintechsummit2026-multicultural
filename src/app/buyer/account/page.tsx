'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/components/XRPLProvider';
import Link from 'next/link';
import * as xrpl from 'xrpl';

interface TokenBalance {
  currency: string;
  value: string;
  issuer: string;
}

export default function BuyerAccountPage() {
  const { address, balance, isConnected, connectNewWallet, getClient } = useWallet();

  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountTokens = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const client = await getClient();

      const res = await client.request({
        command: 'account_lines',
        account: address,
      });

      await client.disconnect();

      const balances: TokenBalance[] = res.result.lines.map(line => ({
        currency: line.currency,
        value: line.balance,
        issuer: line.account,
      }));

      setTokens(balances);
    } catch (err) {
      console.error(err);
      setError('Failed to load account tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchAccountTokens();
    }
  }, [isConnected, address]);

  const rlusdBalance = tokens.find(t => t.currency === 'RLUSD');

  if (!isConnected) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <p className="text-gray-600 mb-4">
          Please connect your wallet to view your account.
        </p>
        <Link
          href="/"
          className="text-green-600 underline"
        >
          Go back to home
        </Link>
      </div>
    );
  }


  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">My Account</h1>

      {/* Wallet Info */}
      <div className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-gray-500 text-sm">Wallet Address</p>
          <p className="font-mono text-sm break-all">{address}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">XRP Balance</p>
          <p className="text-xl font-bold">
            {balance ? Number(balance).toFixed(2) : '0'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">RLUSD Balance</p>
          <p className="text-xl font-bold">
            {rlusdBalance ? rlusdBalance.value : '0'}
          </p>
        </div>
      </div>

      {/* Token List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Owned Tokens</h2>

        {loading && <p className="text-gray-500">Loading tokens…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && tokens.length === 0 && (
          <p className="text-gray-500">No tokens found.</p>
        )}

        <div className="space-y-3">
          {tokens.map((token, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{token.currency}</p>
                <p className="text-xs text-gray-500 font-mono">
                  Issuer: {token.issuer.slice(0, 6)}…{token.issuer.slice(-4)}
                </p>
              </div>
              <p className="font-bold">{token.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
