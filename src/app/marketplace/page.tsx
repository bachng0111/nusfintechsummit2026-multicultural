'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/buyer/BuyerXRPLProvider';
import { useRouter } from 'next/navigation';
import { Leaf, ExternalLink, Calendar, Hash, Coins, Clock, ShoppingCart, X, CheckCircle, Loader2 } from 'lucide-react';
import {
  createPurchaseRequest,
  getRequestsForBuyer,
  PurchaseRequest,
  notifyIssuer,
  updatePurchaseRequest,
  getCancelAfterTime,
} from '@/lib/escrow';
import * as xrpl from 'xrpl';

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
  const [buyerRequests, setBuyerRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseStep, setPurchaseStep] = useState<'confirm' | 'waiting' | 'paying' | 'done'>('confirm');

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

  // Load buyer's purchase requests
  useEffect(() => {
    if (address) {
      setBuyerRequests(getRequestsForBuyer(address));
    }
  }, [address]);

  // Poll for approval status updates
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      const requests = getRequestsForBuyer(address);
      setBuyerRequests(requests);
      
      // Check if any pending request has been approved by issuer
      const approvedRequest = requests.find(r => r.status === 'approved');
      if (approvedRequest && purchaseStep === 'waiting') {
        // Auto-trigger escrow creation by buyer (to send XRP to issuer)
        handleCreateEscrowAndPay(approvedRequest);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [address, purchaseStep]);

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
    setPurchaseStep('confirm');
  };

  const handleConfirmPurchase = async (token: MintedToken) => {
    if (!address) {
      alert('Wallet not connected!');
      return;
    }

    setBuying(true);

    try {
      const pricePerCredit = parseFloat(token.metadata?.pricePerCredit || '10');
      const totalPrice = pricePerCredit * token.amount;

      // Create a purchase request instead of direct payment
      const request = createPurchaseRequest(
        address,
        token.issuanceId,
        token.amount,
        totalPrice,
        token.address
      );

      // Notify the issuer about the purchase request
      notifyIssuer(token.address, 'New purchase request', {
        requestId: request.id,
        buyerAddress: address,
        tokenIssuanceId: token.issuanceId,
        amount: token.amount,
        priceXRP: totalPrice,
      });

      console.log('Purchase request created:', request);
      setBuyerRequests(prev => [...prev, request]);
      
      // Move to waiting step
      setPurchaseStep('waiting');
    } catch (err) {
      console.error('Failed to create purchase request:', err);
      alert('Failed to create purchase request. Check console for details.');
      setBuying(false);
    }
  };

  // Handle creating escrow (buyer sends XRP to issuer) after issuer approves
  const handleCreateEscrowAndPay = async (request: PurchaseRequest) => {
    if (!address || purchaseStep === 'paying') return;
    
    setPurchaseStep('paying');

    try {
      const client = await getClient();
      if (!client) throw new Error('XRPL client not available');

      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet not available');

      // Create escrow from BUYER to ISSUER (buyer sends XRP payment)
      // The issuer will use the fulfillment to finish the escrow and receive the XRP
      const escrowCreate = {
        TransactionType: 'EscrowCreate' as const,
        Account: address, // Buyer is the source
        Destination: request.issuerAddress, // Issuer receives the XRP
        Amount: xrpl.xrpToDrops(request.priceXRP),
        Condition: request.escrowCondition, // Condition from issuer's approval
        CancelAfter: getCancelAfterTime(1), // 1 hour expiry
      };

      console.log('[Buyer Escrow] Creating escrow to pay issuer:', escrowCreate);

      const prepared = await client.autofill(escrowCreate);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      console.log('[Buyer Escrow] Result:', result);

      const txResult = (result.result.meta as { TransactionResult?: string })?.TransactionResult;
      if (txResult !== 'tesSUCCESS') {
        throw new Error(`Escrow creation failed: ${txResult}`);
      }

      // Get the escrow sequence
      const escrowSequence = (prepared as { Sequence?: number }).Sequence || 0;

      // Update the request with escrow info so issuer can finish it
      updatePurchaseRequest(request.id, {
        status: 'escrow_created',
        escrowSequence,
        txHash: result.result.hash,
      });

      // Also authorize the MPT token so issuer can send tokens to buyer
      // Buyer needs to authorize before receiving MPT tokens
      const mptAuthorize = {
        TransactionType: 'MPTokenAuthorize' as const,
        Account: address,
        MPTokenIssuanceID: request.tokenIssuanceId,
      };

      console.log('[MPT] Authorizing token to receive:', mptAuthorize);

      const preparedAuth = await client.autofill(mptAuthorize);
      const signedAuth = wallet.sign(preparedAuth);
      const authResult = await client.submitAndWait(signedAuth.tx_blob);

      console.log('[MPT] Authorization result:', authResult);

      setPurchaseStep('done');
      
      // Update request status locally
      const updatedRequests = buyerRequests.map(r =>
        r.id === request.id ? { ...r, status: 'escrow_created' as const } : r
      );
      setBuyerRequests(updatedRequests);

      // Remove the purchased token from marketplace localStorage and update state
      // Note: The token metadata is preserved in 'allMintedTokensArchive' for buyer's account page
      const storedTokens = localStorage.getItem('mintedTokens');
      if (storedTokens) {
        try {
          const parsedTokens: MintedToken[] = JSON.parse(storedTokens);
          const updatedTokens = parsedTokens.filter(
            (t) => t.issuanceId !== request.tokenIssuanceId
          );
          localStorage.setItem('mintedTokens', JSON.stringify(updatedTokens));
          setTokens(updatedTokens);
        } catch (err) {
          console.error('Failed to update localStorage after purchase:', err);
        }
      }

      alert('Payment escrow created! The issuer will now complete the transaction and send you the tokens.');
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed. Check console for details.');
      setPurchaseStep('confirm');
    } finally {
      setBuying(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedToken(null);
    setPurchaseStep('confirm');
    setBuying(false);
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
              <h3 className="text-xl font-bold text-gray-900">
                {purchaseStep === 'confirm' && 'Confirm Purchase'}
                {purchaseStep === 'waiting' && 'Waiting for Issuer'}
                {purchaseStep === 'paying' && 'Processing Payment'}
                {purchaseStep === 'done' && 'Purchase Complete!'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {['Request', 'Escrow', 'Payment', 'Complete'].map((step, idx) => {
                const stepStates = { confirm: 0, waiting: 1, paying: 2, done: 3 };
                const currentStep = stepStates[purchaseStep];
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isActive ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      } ${isCurrent ? 'ring-2 ring-green-300' : ''}`}>
                        {isActive && idx < currentStep ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={`text-xs mt-1 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {step}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div className={`flex-1 h-0.5 mx-2 ${idx < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step Content */}
            {purchaseStep === 'confirm' && (
              <>
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

                <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-700">
                  <p>💡 <strong>How it works:</strong> Your purchase request will be sent to the issuer. 
                  Once they create a secure escrow, your payment will be processed automatically.</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmPurchase(selectedToken)}
                    disabled={buying}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Send Purchase Request
                  </button>
                </div>
              </>
            )}

            {purchaseStep === 'waiting' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Waiting for Issuer</h4>
                <p className="text-gray-500 mb-4">
                  Your purchase request has been sent. The issuer will create a secure escrow for your tokens.
                </p>
                <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700">
                  ⏳ Once the escrow is ready, payment will process automatically.
                </div>
              </div>
            )}

            {purchaseStep === 'paying' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Processing Payment</h4>
                <p className="text-gray-500">
                  Sending XRP to complete the escrow...
                </p>
              </div>
            )}

            {purchaseStep === 'done' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Purchase Complete!</h4>
                <p className="text-gray-500 mb-4">
                  You have successfully purchased {selectedToken.amount} carbon credit(s) from {selectedToken.metadata?.projectName || 'this project'}.
                </p>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            )}
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
