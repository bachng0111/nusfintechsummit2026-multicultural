'use client';

import { useState } from 'react';
import * as xrpl from 'xrpl';
import { useWallet } from './BuyerXRPLProvider';

// ---------------- Update: Added token metadata props ----------------
interface RetireTokenButtonProps {
  currency: string;          // token ticker
  issuer: string;            // token issuer address
  amount: string;            // amount to retire
  onRetired?: (certificate: any) => void;
}

export function RetireTokenButton({ currency, issuer, amount, onRetired }: RetireTokenButtonProps) {
  const { getWallet, getClient } = useWallet();
  const [isRetiring, setIsRetiring] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleRetire = async () => {
    setIsRetiring(true);
    setError('');
    setSuccessMessage('');

    const wallet = getWallet();
    if (!wallet) {
      setError('Wallet not connected');
      setIsRetiring(false);
      return;
    }

    try {
      const client = await getClient();

      // ---------------- Use burner account for retirement ----------------
      const burnerAddress = 'rJP2saa6mD796QqKyBUSkxhgkDySkJgnxf';

      // ---------------- Update: Real issued token Amount format ----------------
      const retireTx: xrpl.Payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: burnerAddress,
        Amount: {
          currency,
          value: amount,
          issuer
        }
      };

      const response = await client.submitAndWait(retireTx, { wallet });

      // ---------------- Update: Use engine_result instead of meta.TransactionResult ----------------
      let txResult = 'Unknown'
      if (
        response.result &&
        typeof response.result === 'object' &&
        'engine_result' in response.result
      ) {
        txResult = response.result.engine_result as string
      }

      if (txResult === 'tesSUCCESS') {
        const certificate = {
          certificateId: crypto.randomUUID(),
          currency,
          issuer,
          amount,
          retiredAt: new Date().toISOString(),
          txHash: response.result.hash
        };

        setSuccessMessage(`✅ Token retired successfully! Tx: ${response.result.hash}`);
        if (onRetired) onRetired(certificate);
      } else {
        setError(`❌ Retirement failed: ${txResult}`);
      }

      await client.disconnect();
    } catch (err: any) {
      setError(`💥 Error: ${err.message || err}`);
      console.error(err);
    } finally {
      setIsRetiring(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleRetire}
        disabled={isRetiring}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {isRetiring ? 'Retiring...' : '🔥 Retire Token'}
      </button>

      {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
