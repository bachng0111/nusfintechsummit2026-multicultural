'use client';

import React, { useState } from 'react';
import { Payment, Client, Wallet } from 'xrpl';

interface BuyMPTButtonProps {
  client: Client;             // Connected XRPL client
  wallet: Wallet;             // User's XRPL wallet
  mptIssuanceId: string;      // MPT issuance ID to authorize
  onSuccess?: () => void;     // Optional callback after success
  onError?: (error: any) => void; // Optional callback on error
}

export default function BuyMPTButton({
  client,
  wallet,
  mptIssuanceId,
  onSuccess,
  onError
}: BuyMPTButtonProps) {
  const [loading, setLoading] = useState(false);

  async function authorizeMPT() {
    if (!client || !wallet || !mptIssuanceId) return;

    setLoading(true);

    try {
      console.log(`🔐 Authorizing wallet ${wallet.address} to hold MPT ${mptIssuanceId}`);

      const authTx = {
        TransactionType: 'MPTokenAuthorize',
        Account: wallet.address,
        MPTokenIssuanceID: mptIssuanceId
      };

      const response = await client.submitAndWait(authTx, { wallet, autofill: true });

      const result = response.result?.meta?.TransactionResult || 'Unknown';
      if (result !== 'tesSUCCESS') {
        throw new Error(`Authorization failed: ${result}`);
      }

      console.log(`✅ Wallet authorized successfully!`);

      // -------------------------------
      // Pseudo code for notifying the issuer API
      // -------------------------------
      // await fetch('/api/notify-issuer', {
      //   method: 'POST',
      //   body: JSON.stringify({ wallet: wallet.address, mptId: mptIssuanceId }),
      //   headers: { 'Content-Type': 'application/json' }
      // });

      console.log('📢 Issuer notified (pseudo code)');

      onSuccess?.();
    } catch (error: any) {
      console.error('💥 Authorization failed:', error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={authorizeMPT}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-white font-medium ${
        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {loading ? 'Authorizing...' : 'Authorize MPT'}
    </button>
  );
}
