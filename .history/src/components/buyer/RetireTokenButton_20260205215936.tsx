'use client';

import { useState } from 'react';
import * as xrpl from 'xrpl';
import { useWallet } from './BuyerXRPLProvider';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { saveRetirementCertificate, RetirementCertificate as ApiRetirementCertificate } from '@/lib/tokens-api';

// TYPES

interface RetireTokenButtonProps {
  mptIssuanceId: string;  // MPT Issuance ID for the token
  currency: string;
  issuer: string;
  amount: string;
  onRetired?: (certificate: RetirementCertificate) => void;
}

interface RetirementCertificate {
  certificateId: string;
  mptIssuanceId: string;
  currency: string;
  issuer: string;
  ownerAddress: string;
  amount: string;
  retiredAt: string;
  txHash: string;
  reason?: string;
}

// CONSTANTS

// Known XRPL "black hole" addresses that no one controls
const BURNER_ADDRESSES = {
  // Standard black hole (account that cannot sign transactions)
  BLACK_HOLE: 'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
  
  // Alternative black hole
  ACCOUNT_ZERO: 'rrrrrrrrrrrrrrrrrrrn5RM1rHd',
};

// Use the standard black hole for true retirement
const BURNER_ADDRESS = BURNER_ADDRESSES.BLACK_HOLE;

// COMPONENT

export function RetireTokenButton({ 
  mptIssuanceId,
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
  // For MPT tokens, we send the tokens back to the issuer to "retire" them
  // The issuer can then burn them or keep them in their treasury

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

    // Validate issuer address is a valid XRPL address (starts with 'r' and is 25-35 chars)
    if (!issuer || !issuer.startsWith('r') || issuer.length < 25 || issuer.length > 35) {
      setError('Invalid issuer address. Token metadata may be missing.');
      setIsRetiring(false);
      return;
    }

    let client: xrpl.Client | null = null;

    try {
      client = await getClient();

      // Convert amount to smallest unit (AssetScale: 2 means multiply by 100)
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * 100).toString();

      // For MPT retirement, send tokens back to the ISSUER
      // This is the standard way to "retire" carbon credits - return them to issuer
      const retireTx = {
        TransactionType: 'Payment' as const,
        Account: wallet.address,
        Destination: issuer, // Send back to issuer for retirement
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: amountInSmallestUnit,
        },
        Memos: [
          {
            Memo: {
              MemoType: xrpl.convertStringToHex('retirement'),
              MemoData: xrpl.convertStringToHex(
                JSON.stringify({
                  action: 'CARBON_CREDIT_RETIREMENT',
                  mptIssuanceId: mptIssuanceId,
                  amount: amount,
                  timestamp: Date.now(),
                  reason: 'Carbon offset retirement',
                })
              ),
            },
          },
        ],
      };

      console.log('📤 Submitting MPT retirement transaction (sending to issuer):', retireTx);

      // Autofill, sign, and submit
      const prepared = await client.autofill(retireTx);
      const signed = wallet.sign(prepared);
      const response = await client.submitAndWait(signed.tx_blob);

      console.log('📨 Transaction response:', response);

      // Check transaction result
      const txResult = (response.result.meta as { TransactionResult?: string })?.TransactionResult || 'Unknown';

      console.log('✅ Transaction result:', txResult);

      // Check for success
      if (txResult === 'tesSUCCESS') {
        const certificate: RetirementCertificate = {
          certificateId: crypto.randomUUID(),
          mptIssuanceId,
          currency,
          issuer,
          ownerAddress: wallet.address,
          amount,
          retiredAt: new Date().toISOString(),
          txHash: response.result.hash,
          reason: 'Carbon offset retirement',
        };

        // Save certificate to Supabase via API
        const saved = await saveRetirementCertificate(certificate as ApiRetirementCertificate);
        if (!saved) {
          console.warn('Failed to save retirement certificate to database, falling back to localStorage');
          // Fallback to localStorage if API fails
          const existingCerts = JSON.parse(localStorage.getItem('retirementCertificates') || '[]');
          existingCerts.push(certificate);
          localStorage.setItem('retirementCertificates', JSON.stringify(existingCerts));
        }

        setSuccessMessage(`Token retired successfully! Certificate ID: ${certificate.certificateId.slice(0, 8)}...`);
        
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
      if (err.message?.includes('tecUNFUNDED') || err.message?.includes('unfunded')) {
        setError('Insufficient token balance to retire');
      } else if (err.message?.includes('tecNO_LINE') || err.message?.includes('tecNO_AUTH')) {
        setError('Token authorization issue. The burn address may not be authorized for this MPT.');
      } else if (err.message?.includes('tecINSUF_RESERVE')) {
        setError('Insufficient XRP reserve. You need at least 10 XRP in your account.');
      } else if (err.message?.includes('tecNO_DST')) {
        setError('Destination address does not exist or cannot receive this token.');
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
              The carbon credits will be sent back to the issuer for retirement, permanently removing them from your wallet and marking them as offset.
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
                <span className="font-semibold">{amount} tons CO₂</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MPT ID:</span>
                <span className="font-mono text-xs">
                  {mptIssuanceId.slice(0, 8)}...{mptIssuanceId.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Return to:</span>
                <span className="font-mono text-xs">
                  Issuer ({issuer.slice(0, 6)}...{issuer.slice(-4)})
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
