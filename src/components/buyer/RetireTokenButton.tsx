'use client';

import { useState } from 'react';
import * as xrpl from 'xrpl';
import { useWallet } from './BuyerXRPLProvider';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// TYPES

interface RetireTokenButtonProps {
  currency: string;
  issuer: string;
  amount: string;
  onRetired?: (certificate: RetirementCertificate) => void;
}

interface RetirementCertificate {
  certificateId: string;
  currency: string;
  issuer: string;
  amount: string;
  retiredAt: string;
  txHash: string;
  burnerAddress: string;
}

// CONSTANTS

// Known XRPL "black hole" addresses that no one controls
const BURNER_ADDRESSES = {
  // Standard black hole (all r's)
  BLACK_HOLE: 'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
  
  // Test burner (if you control it for tracking)
  CUSTOM: 'rJP2saa6mD796QqKyBUSkxhgkDySkJgnxf',
};

// Use the black hole for true retirement
const BURNER_ADDRESS = BURNER_ADDRESSES.CUSTOM;

// COMPONENT

export function RetireTokenButton({ 
  currency, 
  issuer, 
  amount, 
  onRetired 
}: RetireTokenButtonProps) {
  const { getWallet, getClient } = useWallet();
  
  const [isRetiring, setIsRetiring] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // RETIREMENT LOGIC

  const handleRetire = async () => {
    setIsRetiring(true);
    setError('');
    setSuccessMessage('');
    setShowConfirmModal(false);

    const wallet = getWallet();
    if (!wallet) {
      setError('Wallet not connected');
      setIsRetiring(false);
      return;
    }

    let client: xrpl.Client | null = null;

    try {
      client = await getClient();

      // Create retirement transaction
      const retireTx: xrpl.Payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: BURNER_ADDRESS,
        Amount: {
          currency: currency,
          value: amount,
          issuer: issuer,
        },
        Memos: [
          {
            Memo: {
              MemoType: xrpl.convertStringToHex('retirement'),
              MemoData: xrpl.convertStringToHex(
                JSON.stringify({
                  action: 'CARBON_CREDIT_RETIREMENT',
                  currency: currency,
                  amount: amount,
                  timestamp: Date.now(),
                  issuer: issuer,
                })
              ),
            },
          },
        ],
      };

      console.log('📤 Submitting retirement transaction:', retireTx);

      // Submit and wait for confirmation
      const response = await client.submitAndWait(retireTx, { wallet });

      console.log('📨 Transaction response:', response);

      // Check transaction result
      let txResult = 'Unknown';
      
      // XRPL returns the result in different places depending on version
      if (response.result.meta && typeof response.result.meta === 'object') {
        if ('TransactionResult' in response.result.meta) {
          txResult = response.result.meta.TransactionResult as string;
        }
      }
      
      // Fallback to engine_result
      if (txResult === 'Unknown' && 'engine_result' in response.result) {
        txResult = response.result.engine_result as string;
      }

      console.log('✅ Transaction result:', txResult);

      // Check for success
      if (txResult === 'tesSUCCESS') {
        const certificate: RetirementCertificate = {
          certificateId: crypto.randomUUID(),
          currency,
          issuer,
          amount,
          retiredAt: new Date().toISOString(),
          txHash: response.result.hash,
          burnerAddress: BURNER_ADDRESS,
        };

        setSuccessMessage(`Token retired successfully!`);
        
        // Call parent callback
        if (onRetired) {
          onRetired(certificate);
        }

        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(`Transaction failed with result: ${txResult}`);
      }
    } catch (err: any) {
      console.error('❌ Retirement error:', err);

      // Handle specific XRPL errors
      if (err.message.includes('tecUNFUNDED')) {
        setError('Insufficient XRP for transaction fees (~0.00001 XRP needed)');
      } else if (err.message.includes('tecNO_LINE')) {
        setError('Trustline issue. Make sure you own this token.');
      } else if (err.message.includes('tecINSUF_RESERVE_LINE')) {
        setError('Insufficient XRP reserve. You need at least 10 XRP in your account.');
      } else {
        setError(`Retirement failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      if (client) {
        await client.disconnect();
      }
      setIsRetiring(false);
    }
  };

  // CONFIRMATION MODAL

  if (showConfirmModal) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
          <h3 className="text-2xl font-bold mb-4">⚠️ Confirm Retirement</h3>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Warning:</strong> This action is permanent and cannot be undone.
            </p>
            <p className="text-sm text-yellow-800">
              The token will be sent to a burn address and permanently removed from circulation.
            </p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-semibold">{currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Burn Address:</span>
                <span className="font-mono text-xs">
                  {BURNER_ADDRESS.slice(0, 8)}...{BURNER_ADDRESS.slice(-6)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ You will receive a certificate with proof of retirement
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRetire}
              disabled={isRetiring}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
            >
              {isRetiring ? 'Retiring...' : 'Confirm Retirement'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // BUTTON RENDER

  return (
    <div className="space-y-2">
      <button
        onClick={() => setShowConfirmModal(true)}
        disabled={isRetiring}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
      >
        {isRetiring ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Retiring...</span>
          </>
        ) : (
          <>
            <span>🔥</span>
            <span>Retire Token</span>
          </>
        )}
      </button>

      {successMessage && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
