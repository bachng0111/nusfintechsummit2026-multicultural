'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/components/buyer/BuyerXRPLProvider';
import { AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface TokenBalance {
  currency: string;
  value: string;
  issuer: string;
}

export default function BuyerAccountPage() {
  const { address, balance, isConnected, getClient } = useWallet();

  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountTokens = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    let client;
    try {
      client = await getClient();

      const res = await client.request({
        command: 'account_lines',
        account: address,
        ledger_index: 'validated',
      });

      const balances: TokenBalance[] = res.result.lines.map((line: any) => ({
        currency: line.currency,
        value: line.balance,
        issuer: line.account,
      }));

      setTokens(balances);
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setError('Failed to load account tokens. Please try again.');
    } finally {
      if (client) {
        await client.disconnect();
      }
      setLoading(false);
    }
  };

  // Fetch tokens when wallet address becomes available
  useEffect(() => {
    if (address) {
      fetchAccountTokens();
    }
  }, [address]);

  // Get RLUSD balance
  const rlusdBalance = tokens.find(t => t.currency === 'RLUSD');

  // Get carbon credit tokens (customize this filter based on your naming convention)
  const carbonTokens = tokens.filter(t => 
    t.currency.startsWith('CARBON') || t.currency.includes('CC')
  );

  // Guard: not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your account and manage your carbon credits.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Home & Connect
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">
              Manage your carbon credits and track your environmental impact
            </p>
          </div>
          <button
            onClick={fetchAccountTokens}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Wallet Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wallet Address Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-600 mb-2">Wallet Address</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm text-gray-900 break-all">
                {address?.slice(0, 10)}...{address?.slice(-8)}
              </p>
              <a
                href={`https://devnet.xrpl.org/accounts/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 p-1 hover:bg-gray-100 rounded"
                title="View on XRPL Explorer"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            </div>
          </div>

          {/* XRP Balance Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-600 mb-2">XRP Balance</p>
            <p className="text-3xl font-bold text-green-600">
              {balance ? Number(balance).toFixed(2) : '0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Available for transactions</p>
          </div>

          {/* RLUSD Balance Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-sm font-medium text-gray-600 mb-2">RLUSD Balance</p>
            <p className="text-3xl font-bold text-purple-600">
              {rlusdBalance ? parseFloat(rlusdBalance.value).toFixed(2) : '0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Available for purchases</p>
          </div>
        </div>

        {/* Carbon Credits Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Carbon Credit Tokens
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {carbonTokens.length} token{carbonTokens.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {carbonTokens.length === 0 && (
              <Link
                href="/marketplace"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse Marketplace
              </Link>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading tokens from XRPL...</p>
            </div>
          )}

          {!loading && carbonTokens.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                No carbon credit tokens found in your wallet.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Purchase carbon credits from the marketplace to start offsetting your emissions.
              </p>
              <Link
                href="/marketplace"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Marketplace
              </Link>
            </div>
          )}

          {!loading && carbonTokens.length > 0 && (
            <div className="space-y-3">
              {carbonTokens.map((token, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {token.currency}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          ACTIVE
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Issuer:</span>
                          <span className="font-mono text-xs">
                            {token.issuer.slice(0, 8)}...{token.issuer.slice(-6)}
                          </span>
                          <a
                            href={`https://devnet.xrpl.org/accounts/${token.issuer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        {parseFloat(token.value).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">tons CO₂</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      Retire Token
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Tokens Section (Optional - shows all tokens including non-carbon) */}
        {!loading && tokens.length > carbonTokens.length && (
          <details className="bg-white rounded-lg shadow-md p-6">
            <summary className="text-lg font-semibold text-gray-900 cursor-pointer">
              All Tokens ({tokens.length})
            </summary>
            <div className="mt-4 space-y-3">
              {tokens.map((token, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{token.currency}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      Issuer: {token.issuer.slice(0, 6)}…{token.issuer.slice(-4)}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">{parseFloat(token.value).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
