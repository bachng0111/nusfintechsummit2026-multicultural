'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import * as xrpl from 'xrpl';

const XRPL_DEVNET = 'wss://s.devnet.rippletest.net:51233'

interface WalletContextType {
  address: string | null
  seed: string | null
  balance: string | null
  isConnected: boolean
  isConnecting: boolean
  connectNewWallet: () => Promise<void>
  connectFromSeed: (seed: string) => Promise<void>
  disconnect: () => void
  getClient: () => Promise<xrpl.Client>
  getWallet: () => xrpl.Wallet | null
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  seed: null,
  balance: null,
  isConnected: false,
  isConnecting: false,
  connectNewWallet: async () => {},
  connectFromSeed: async () => {},
  disconnect: () => {},
  getClient: async () => new xrpl.Client(XRPL_DEVNET),
  getWallet: () => null,
});

export function useWallet() {
  return useContext(WalletContext);
}

export function XRPLProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState<xrpl.Wallet | null>(null);

  // account persistence using LocalStorage
  useEffect(() => {
    const restoreWallet = async () => {
      const savedSeed = localStorage.getItem('xrpl_wallet_seed');
      if (savedSeed) {
        try {
          const restoredWallet = xrpl.Wallet.fromSeed(savedSeed);
          setWallet(restoredWallet);
          setAddress(restoredWallet.classicAddress);
          setSeed(savedSeed);

          const client = new xrpl.Client(XRPL_DEVNET);
          await client.connect();
          try {
            const xrpBalance = await client.getXrpBalance(restoredWallet.address)
            setBalance(String(xrpBalance));
          } catch {
            setBalance('0');
          }
          await client.disconnect();

        } catch (err) {
          console.error('Failed to restore wallet from seed:', err);
          localStorage.removeItem('xrpl_wallet_seed'); // clean invalid seed
        }
      }
    }

    restoreWallet();
  }, [])

  // Get a new funded wallet from the faucet (for Devnet/Testnet)
  const connectNewWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const client = new xrpl.Client(XRPL_DEVNET);
      await client.connect();

      // Fund a new wallet using the faucet
      const fundResult = await client.fundWallet();
      const newWallet = fundResult.wallet;

      setWallet(newWallet);
      setAddress(newWallet.address);
      setSeed(newWallet.seed || null);

      if (newWallet.seed) {
        localStorage.setItem('xrpl_wallet_seed', newWallet.seed);
      }

      // Get balance
      const xrpBalance = await client.getXrpBalance(newWallet.address);
      setBalance(String(xrpBalance));

      await client.disconnect();
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect using an existing seed
  const connectFromSeed = useCallback(async (existingSeed: string) => {
    setIsConnecting(true)
    try {
      const client = new xrpl.Client(XRPL_DEVNET);
      await client.connect();

      // Derive wallet from seed
      const existingWallet = xrpl.Wallet.fromSeed(existingSeed);

      setWallet(existingWallet);
      setAddress(existingWallet.address);
      setSeed(existingSeed);

      localStorage.setItem('xrpl_wallet_seed', existingSeed);

      // Get balance
      try {
        const xrpBalance = await client.getXrpBalance(existingWallet.address);
        setBalance(String(xrpBalance));
      } catch {
        setBalance('0');
      }

      await client.disconnect();
    } catch (error) {
      console.error('Failed to connect from seed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSeed(null);
    setBalance(null);
    setWallet(null);

    localStorage.removeItem('xrpl_wallet_seed');
  }, []);

  // Get a connected client
  const getClient = useCallback(async () => {
    const client = new xrpl.Client(XRPL_DEVNET);
    await client.connect();
    return client;
  }, []);

  // Get the current wallet instance
  const getWallet = useCallback(() => {
    return wallet;
  }, [wallet]);

  return (
    <WalletContext.Provider
      value={{
        address,
        seed,
        balance,
        isConnected: !!address,
        isConnecting,
        connectNewWallet,
        connectFromSeed,
        disconnect,
        getClient,
        getWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Wallet Connect Button Component
export function WalletConnectButton() {
  const { address, balance, isConnected, isConnecting, connectNewWallet, disconnect } = useWallet();
  const [showSeedInput, setShowSeedInput] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-right">
          <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium block">
            {formatAddress(address)}
          </span>
          {balance && (
            <span className="text-xs text-gray-500">{parseFloat(balance).toFixed(2)} XRP</span>
          )}
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connectNewWallet}
      disabled={isConnecting}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating Wallet...
        </>
      ) : (
        '🔗 Get Test Wallet (Devnet)'
      )}
    </button>
  );
}
