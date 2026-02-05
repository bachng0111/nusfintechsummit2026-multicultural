'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/components/buyer/BuyerXRPLProvider';
import { AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { RetireTokenButton } from '@/components/buyer/RetireTokenButton';
import { getRequestsForBuyer, PurchaseRequest } from '@/lib/escrow';
import { fetchAllArchivedTokens, MintedToken } from '@/lib/tokens-api';

// XRPL Devnet explorer URL
const DEVNET_EXPLORER_URL = 'https://devnet.xrpl.org';

// ---------------- TokenBalance metadata ----------------
interface TokenBalance {
  mptIssuanceId: string;          // MPT issuance ID
  currency: string;               // ticker
  value: string;
  issuer: string;
  name: string;                   // token full name
  icon?: string;                  // token icon URL
  retired?: boolean;
  projectName?: string;
  pricePerCredit?: string;
  certification?: string;
  vintage?: string;
  description?: string;
  ipfsHash?: string;
  txHash?: string;
  purchasedAt?: string;
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
  const { address, isConnected, balance, getClient, refreshBalance } = useWallet();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rlusdBalance, setRlusdBalance] = useState<string | null>(null);

  // Fetch tokens from XRPL and merge with API metadata
  const fetchAccountTokens = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    let client;
    try {
      client = await getClient();

      // Get all minted tokens from permanent archive via API (for metadata lookup)
      let allTokensForLookup: MintedToken[] = [];
      try {
        allTokensForLookup = await fetchAllArchivedTokens();
      } catch (apiErr) {
        console.warn('[Account] Failed to fetch from API, falling back to localStorage:', apiErr);
        // Fallback to localStorage if API fails
        const archiveRaw = localStorage.getItem('allMintedTokensArchive');
        allTokensForLookup = archiveRaw ? JSON.parse(archiveRaw) : [];
      }

      // Get retirement certificates to check retired status and preserve original values
      const retirementCertsRaw = localStorage.getItem('retirementCertificates');
      const retirementCerts: { mptIssuanceId: string; amount: string; retiredAt: string; txHash: string }[] = 
        retirementCertsRaw ? JSON.parse(retirementCertsRaw) : [];
      const retiredTokenMap = new Map(retirementCerts.map(cert => [cert.mptIssuanceId, cert]));

      // Get completed purchase requests for this buyer
      const buyerRequests = getRequestsForBuyer(address);
      const completedPurchases = buyerRequests.filter(r => r.status === 'completed');

      // Fetch MPT holdings from XRPL
      let mptHoldings: any[] = [];
      try {
        const mptRes = await client.request({
          command: 'account_objects',
          account: address,
          type: 'mptoken',
          ledger_index: 'validated'
        });
        mptHoldings = mptRes.result.account_objects || [];
        console.log('[Account] MPT holdings from XRPL:', mptHoldings);
      } catch (mptErr) {
        console.log('[Account] No MPT holdings or error fetching:', mptErr);
      }

      // Build token balances from MPT holdings + metadata
      const balances: TokenBalance[] = mptHoldings.map((mpt: any) => {
        const issuanceId = mpt.MPTokenIssuanceID;
        
        // Find matching token for metadata (check purchased tokens first, then minted)
        const matchedToken = allTokensForLookup.find(t => t.issuanceId === issuanceId);
        
        // Find matching purchase for additional context
        const purchase = completedPurchases.find(p => p.tokenIssuanceId === issuanceId);

        // Check if token is retired
        const retirementCert = retiredTokenMap.get(issuanceId);
        const isRetired = !!retirementCert;

        // MPT value is stored with AssetScale, need to convert
        // AssetScale: 2 means divide by 100
        const rawValue = mpt.MPTAmount || '0';
        // Use retirement certificate amount if retired, otherwise use XRPL value
        const value = isRetired && retirementCert?.amount 
          ? retirementCert.amount 
          : (parseInt(rawValue) / 100).toString();

        return {
          mptIssuanceId: issuanceId,
          currency: matchedToken?.metadata?.creditType || 'CARBON',
          value: value,
          issuer: matchedToken?.address || mpt.issuer || 'Unknown',
          name: matchedToken?.metadata?.projectName || `Carbon Credit ${issuanceId.slice(0, 8)}...`,
          projectName: matchedToken?.metadata?.projectName,
          pricePerCredit: matchedToken?.metadata?.pricePerCredit,
          certification: matchedToken?.metadata?.certification,
          vintage: matchedToken?.metadata?.vintage,
          description: matchedToken?.metadata?.description,
          ipfsHash: matchedToken?.ipfsHash,
          txHash: purchase?.txHash || matchedToken?.txHash,
          purchasedAt: purchase?.createdAt,
          retired: isRetired,
          additional_info: {
            carbon_tons: value,
            project_name: matchedToken?.metadata?.projectName,
            standard: matchedToken?.metadata?.certification,
          }
        };
      });

      // Add retired tokens that are no longer in MPT holdings (already sent to issuer)
      for (const cert of retirementCerts) {
        const alreadyInBalances = balances.some(b => b.mptIssuanceId === cert.mptIssuanceId);
        if (!alreadyInBalances) {
          const matchedToken = allTokensForLookup.find(t => t.issuanceId === cert.mptIssuanceId);
          const purchase = completedPurchases.find(p => p.tokenIssuanceId === cert.mptIssuanceId);
          
          balances.push({
            mptIssuanceId: cert.mptIssuanceId,
            currency: matchedToken?.metadata?.creditType || 'CARBON',
            value: cert.amount,
            issuer: matchedToken?.address || purchase?.issuerAddress || 'Unknown',
            name: matchedToken?.metadata?.projectName || `Carbon Credit`,
            projectName: matchedToken?.metadata?.projectName,
            pricePerCredit: matchedToken?.metadata?.pricePerCredit,
            certification: matchedToken?.metadata?.certification,
            vintage: matchedToken?.metadata?.vintage,
            description: matchedToken?.metadata?.description,
            ipfsHash: matchedToken?.ipfsHash,
            txHash: cert.txHash,
            purchasedAt: purchase?.createdAt,
            retired: true,
            additional_info: {
              carbon_tons: cert.amount,
              project_name: matchedToken?.metadata?.projectName,
              standard: matchedToken?.metadata?.certification,
            }
          });
        }
      }

      // If no MPT holdings found but we have completed purchases, show those
      // (This handles the case where XRPL query doesn't return data yet)
      if (balances.length === 0 && completedPurchases.length > 0) {
        for (const purchase of completedPurchases) {
          const matchedToken = allTokensForLookup.find(t => t.issuanceId === purchase.tokenIssuanceId);
          const retirementCert = retiredTokenMap.get(purchase.tokenIssuanceId);
          const isRetired = !!retirementCert;
          // Use retirement cert amount if retired, otherwise use purchase amount
          const value = isRetired && retirementCert?.amount 
            ? retirementCert.amount 
            : purchase.tokenAmount.toString();
          
          balances.push({
            mptIssuanceId: purchase.tokenIssuanceId,
            currency: matchedToken?.metadata?.creditType || 'CARBON',
            value: value,
            issuer: purchase.issuerAddress,
            name: matchedToken?.metadata?.projectName || `Carbon Credit`,
            projectName: matchedToken?.metadata?.projectName,
            pricePerCredit: matchedToken?.metadata?.pricePerCredit,
            certification: matchedToken?.metadata?.certification,
            vintage: matchedToken?.metadata?.vintage,
            description: matchedToken?.metadata?.description,
            ipfsHash: matchedToken?.ipfsHash,
            txHash: isRetired ? retirementCert?.txHash : purchase.txHash,
            purchasedAt: purchase.createdAt,
            retired: isRetired,
            additional_info: {
              carbon_tons: value,
              project_name: matchedToken?.metadata?.projectName,
              standard: matchedToken?.metadata?.certification,
            }
          });
        }
      }

      // Fetch RLUSD balance (trust line)
      try {
        const linesRes = await client.request({
          command: 'account_lines',
          account: address,
          ledger_index: 'validated'
        });
        const rlusdLine = linesRes.result.lines?.find(
          (line: any) => line.currency === 'RLUSD' || line.currency === '524C555344000000000000000000000000000000'
        );
        if (rlusdLine) {
          setRlusdBalance(rlusdLine.balance);
        }
      } catch (rlusdErr) {
        console.log('[Account] No RLUSD balance or error fetching:', rlusdErr);
      }

      setTokens(balances);
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setError('Failed to load account tokens. Please try again.');
    } finally {
      if (client) await client.disconnect();
      setLoading(false);
    }
  }, [address, getClient]);

  // ---------------- Fetch tokens on mount and when address changes ----------------
  useEffect(() => {
    if (address) {
      fetchAccountTokens();
    }
  }, [address, fetchAccountTokens]);

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

        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">
              Manage your carbon credits and track your environmental impact
            </p>
          </div>
          <button
            onClick={() => {
              fetchAccountTokens();
              refreshBalance();
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
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
                href={`${DEVNET_EXPLORER_URL}/accounts/${address}`}
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
              {rlusdBalance ? parseFloat(rlusdBalance).toFixed(2) : '0'}
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
                {tokens.length} token{tokens.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {tokens.length === 0 && !loading && (
              <Link
                href="/marketplace"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse Marketplace
              </Link>
            )}
          </div>
          
          {loading && tokens.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading tokens from XRPL...</p>
            </div>
          )}

          {!loading && tokens.length === 0 && (
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

          {!loading && tokens.length > 0 && (
            <div className="space-y-3">
              {tokens.map((token, idx) => (
            <div key={token.mptIssuanceId || idx} className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🌿</span>
                    <h3 className="text-lg font-semibold text-gray-900">{token.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      token.retired 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {token.retired ? 'RETIRED' : 'ACTIVE'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 mt-3">
                    {token.certification && (
                      <div>
                        <span className="font-medium">Certification:</span> {token.certification}
                      </div>
                    )}
                    {token.vintage && (
                      <div>
                        <span className="font-medium">Vintage:</span> {token.vintage}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Issuer:</span>{' '}
                      <code className="bg-gray-100 px-1 rounded text-xs">
                        {token.issuer.slice(0, 8)}...{token.issuer.slice(-4)}
                      </code>
                    </div>
                    {token.purchasedAt && (
                      <div>
                        <span className="font-medium">Purchased:</span>{' '}
                        {new Date(token.purchasedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {token.description && (
                    <p className="text-sm text-gray-500 mt-2">{token.description}</p>
                  )}

                  {/* Links */}
                  <div className="flex gap-4 mt-3">
                    {token.mptIssuanceId && (
                      <a
                        href={`${DEVNET_EXPLORER_URL}/mpt/${token.mptIssuanceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Token
                      </a>
                    )}
                    {token.txHash && (
                      <a
                        href={`${DEVNET_EXPLORER_URL}/transactions/${token.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Transaction
                      </a>
                    )}
                    {token.ipfsHash && (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${token.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Audit Report
                      </a>
                    )}
                  </div>
                </div>

                {/* Token Amount */}
                <div className="text-right ml-6">
                  <p className="text-3xl font-bold text-green-600">{parseFloat(token.value).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">tons CO₂</p>
                  {token.pricePerCredit && (
                    <p className="text-xs text-gray-400 mt-1">
                      @ {token.pricePerCredit} XRP/credit
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                {!token.retired && (
                  <RetireTokenButton
                    mptIssuanceId={token.mptIssuanceId}
                    currency={token.currency}
                    issuer={token.issuer}
                    amount={token.value}
                    onRetired={() => {
                      setTokens(prev =>
                        prev.map(t =>
                          t.mptIssuanceId === token.mptIssuanceId ? { ...t, retired: true } : t
                        )
                      );
                    }}
                  />
                )}
                <a
                  href={`${DEVNET_EXPLORER_URL}/mpt/${token.mptIssuanceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Details
                </a>
              </div>
            </div>
          ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
