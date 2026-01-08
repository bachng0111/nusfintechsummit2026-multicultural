'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/buyer/BuyerXRPLProvider';
import { useRouter } from 'next/navigation';
import { Payment } from 'xrpl';
import { Leaf, ExternalLink, Calendar, Hash, Coins, Clock, ShoppingCart, X } from 'lucide-react';

// Token type matching the issuer's minted token structure
type MintedToken = {
  issuanceId: string;
  address: string;
  metadata: {
    projectName: string;
    creditType: string;
    vintage: string;
    certification: string;
    location: string;
    description: string;
    pricePerCredit: string;
  };
  amount: number;
  timestamp: string;
  txHash: string;
  explorerUrl: string;
  ipfsHash: string;
};

export default function MarketplacePage() {
  const router = useRouter();
  const { isConnected, address, getWallet, getClient } = useWallet();

  const [tokens, setTokens] = useState<MintedToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<MintedToken | null>(null);
  const [buying, setBuying] = useState(false);

  // Load minted tokens from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mintedTokens');
    if (stored) {
      try {
        setTokens(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse stored tokens:', err);
      }
    }
  }, []);

  const handleTokenPurchase = (token: MintedToken) => {
    if (!isConnected) {
      localStorage.setItem(
        'post_login_intent',
        JSON.stringify({
          action: 'BUY_TOKEN',
          tokenId: token.issuanceId,
        })
      );
      router.push('/');
      return;
    }
    setSelectedToken(token);
  };

  const handleConfirmPurchase = async (token: MintedToken) => {
    if (!address) {
      alert('Wallet not connected!');
      return;
    }

    setBuying(true);

    try {
      const client = await getClient();
      if (!client) throw new Error('XRPL client not available');

      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet not available');

      const issuerAddress = token.address; // Use the token issuer's address

      const pricePerCredit = parseFloat(token.metadata?.pricePerCredit || '10');
      const totalPrice = pricePerCredit * token.amount;

      const payment: Payment = {
        TransactionType: 'Payment',
        Account: address,
        Destination: issuerAddress,
        Amount: (totalPrice * 1_000_000).toString(), // XRP in drops
      };

      const result = await client.submitAndWait(payment, { wallet });

      console.log('Purchase successful:', result);
      alert(`Successfully purchased ${token.metadata?.projectName || 'Carbon Credit'}!`);
      setSelectedToken(null);
    } catch (err) {
      console.error('Purchase failed:', err);
      alert('Purchase failed. Check console for details.');
    } finally {
      setBuying(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Carbon Credit Marketplace</h1>
              <p className="text-sm text-gray-500">Browse and purchase verified carbon credits on XRPL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedToken && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Confirm Purchase</h3>
              <button
                onClick={() => setSelectedToken(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-green-800 mb-2">
                {selectedToken.metadata?.projectName || 'Carbon Credit'}
              </h4>
              <p className="text-sm text-green-700 mb-3">
                {selectedToken.metadata?.description || 'Verified carbon offset credit'}
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <Coins className="w-4 h-4" />
                  <span>Amount: {selectedToken.amount} credits</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <Calendar className="w-4 h-4" />
                  <span>Vintage: {selectedToken.metadata?.vintage || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600">Total Price:</span>
                <span className="font-bold text-green-600">
                  {(parseFloat(selectedToken.metadata?.pricePerCredit || '10') * selectedToken.amount).toFixed(2)} XRP
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedToken(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmPurchase(selectedToken)}
                disabled={buying}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {buying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Confirm Purchase
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Carbon Credits
            {tokens.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({tokens.length} token{tokens.length !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>

        {tokens.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens available yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Carbon credits will appear here once issuers mint new tokens. Check back soon or visit the Issuer Portal to create new credits.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token, idx) => (
              <div
                key={token.issuanceId + idx}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                      {token.metadata?.certification || 'Verified'}
                    </span>
                    <span className="text-white/80 text-xs">
                      {token.metadata?.vintage || '2024'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3">
                    {token.metadata?.projectName || 'Carbon Credit'}
                  </h3>
                  <p className="text-green-100 text-sm mt-1">
                    {token.metadata?.creditType || 'Carbon Offset'}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {token.metadata?.description || 'Verified carbon offset credit from sustainable project'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Hash className="w-4 h-4" />
                      <span className="truncate" title={token.issuanceId}>
                        ID: {truncateAddress(token.issuanceId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Coins className="w-4 h-4" />
                      <span>{token.amount} credit{token.amount !== 1 ? 's' : ''} available</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Minted: {formatDate(token.timestamp)}</span>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">Price per credit</span>
                      <span className="text-xl font-bold text-green-600">
                        {token.metadata?.pricePerCredit || '10'} XRP
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTokenPurchase(token)}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </button>
                      {token.explorerUrl && (
                        <a
                          href={token.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
