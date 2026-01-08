'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/components/buyer/BuyerXRPLProvider';
import { AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import AccountInfo from '@/components/buyer/AccountInfo';
import { RetireTokenButton } from '@/components/buyer/RetireTokenButton';

// ---------------- TokenBalance metadata ----------------
interface TokenBalance {
  currency: string;              // ticker
  value: string;
  issuer: string;
  name: string;                  // token full name
  icon?: string;                 // token icon URL
  retired?: boolean;
  additional_info?: {
    carbon_tons?: string;
    methodology?: string;
    project_name?: string;
    registry?: string;
    standard?: string;
    verification_date?: string;
  };
  uris?: { category: string; title: string; uri: string }[];
}

export default function BuyerAccountPage() {
  const { address, isConnected, getClient } = useWallet();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- TEST SETUP ----------------
  const [useMock, setUseMock] = useState(true);

  const mockTokens: TokenBalance[] = [
    {
      currency: 'CAR',
      value: '100',
      issuer: 'rMockIssuer1',
      name: 'Carbon Credit Token 1 (MOCK)',
      icon: 'https://example.org/carbon1.png',
      additional_info: {
        carbon_tons: '100',
        methodology: 'VM0007',
        project_name: 'Project Alpha',
        registry: 'Verra',
        standard: 'VCS',
        verification_date: '2026-01-01'
      },
      uris: [
        { category: 'docs', title: 'Audit Report', uri: 'https://example.org/report1.pdf' }
      ]
    },
    {
      currency: 'CAR',
      value: '50',
      issuer: 'rMockIssuer2',
      name: 'Carbon Credit Token 2 (MOCK)',
      retired: true,
      additional_info: {
        carbon_tons: '50',
        methodology: 'VM0007',
        project_name: 'Project Beta',
        registry: 'Verra',
        standard: 'VCS',
        verification_date: '2026-01-02'
      }
    }
  ];

  // ---------------- Toggle mock/real button ----------------
  const toggleMock = () => setUseMock(prev => !prev);

  // ---------------- Fetch tokens ----------------
  useEffect(() => {
    if (useMock) {
      setTokens(mockTokens);
    } else if (address) {
      fetchAccountTokens();
    }
  }, [address, useMock]);

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
        ledger_index: 'validated'
      });

      const balances: TokenBalance[] = res.result.lines.map((line: any) => ({
        currency: line.currency,
        value: line.balance,
        issuer: line.account,
        name: line.currency,        // fallback, real token metadata can enhance this
        retired: false
      }));

      setTokens(balances);
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setError('Failed to load account tokens. Please try again.');
    } finally {
      if (client) await client.disconnect();
      setLoading(false);
    }
  };

  // ---------------- Account Summary ----------------
  const ownedCount = tokens.filter(t => !t.retired).length;
  const retiredCount = tokens.filter(t => t.retired).length;
  const totalVolume = tokens.reduce((sum, t) => sum + parseFloat(t.value || '0'), 0);

  // ---------------- Guard: Not connected ----------------
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your account and manage your carbon credits.
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Go to Home & Connect
          </Link>
        </div>
      </div>
    );
  }

  // ---------------- Page Content ----------------
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Page Header + Mock Toggle */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">
              Manage your carbon credits and track your environmental impact
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleMock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {useMock ? 'Switch to Real Tokens' : 'Switch to Mock Tokens'}
            </button>
            <button
              onClick={fetchAccountTokens}
              disabled={loading || useMock}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Account Summary */}
        <AccountInfo
          ownedCount={ownedCount}
          retiredCount={retiredCount}
          totalVolume={totalVolume}
          rlusdBalance={0} // update if needed
        />

        {/* Token List */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          {tokens.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">No tokens found in your wallet.</p>
              <Link href="/marketplace" className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Browse Marketplace
              </Link>
            </div>
          )}

          {tokens.map((token, idx) => (
            <div key={idx} className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {token.icon && <img src={token.icon} className="w-6 h-6 rounded-full" />}
                    <h3 className="text-lg font-semibold text-gray-900">{token.name}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {token.retired ? 'RETIRED' : 'ACTIVE'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Issuer: {token.issuer}</div>
                    {token.additional_info?.carbon_tons && (
                      <div>Carbon Tons: {token.additional_info.carbon_tons}</div>
                    )}
                    {token.additional_info?.methodology && (
                      <div>Methodology: {token.additional_info.methodology}</div>
                    )}
                    {token.uris?.map(uri => (
                      <a key={uri.uri} href={uri.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 block text-sm">
                        {uri.title}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">{parseFloat(token.value).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">tons CO₂</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {!token.retired && (
                  <RetireTokenButton
                    currency={token.currency}
                    issuer={token.issuer}
                    amount={token.value}
                    onRetired={() => {
                      setTokens(prev =>
                        prev.map(t =>
                          t.currency === token.currency ? { ...t, retired: true } : t
                        )
                      )
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
