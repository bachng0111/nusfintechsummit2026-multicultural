'use client'

import { useState, useCallback } from 'react'
import { WalletConnectButton, useWallet } from '@/components/XRPLProvider'
import * as xrpl from 'xrpl'

// XRPL Devnet configuration
const DEVNET_EXPLORER_URL = 'https://devnet.xrpl.org/transactions'

/**
 * Mock IPFS Upload Function
 * In production, this would upload to Pinata/IPFS
 * Returns a dummy CID hash
 */
async function mockUploadToIPFS(file: File): Promise<string> {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1500))
  
  // Return a dummy IPFS hash (CID)
  const dummyCID = `QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX`
  console.log(`[Mock IPFS] Uploaded ${file.name} -> ${dummyCID}`)
  return dummyCID
}

/**
 * Convert a string to Hex (for XRPL Domain field)
 */
function stringToHex(str: string): string {
  let hex = ''
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return hex.toUpperCase()
}

/**
 * Pad currency code to 40 hex characters (for non-standard currency codes)
 * XRPL requires currency codes to be either:
 * - 3 ASCII characters (standard like "USD")
 * - 40 hex characters (160 bits) for custom tokens
 */
function formatCurrencyCode(ticker: string): string {
  if (ticker.length === 3) {
    return ticker.toUpperCase()
  }
  // For longer codes, convert to hex and pad to 40 characters
  let hex = ''
  for (let i = 0; i < ticker.length; i++) {
    hex += ticker.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return hex.toUpperCase().padEnd(40, '0')
}

type MintStatus = 'idle' | 'uploading' | 'setting-domain' | 'creating-distribution' | 'setting-trustline' | 'minting' | 'success' | 'error'

interface MintResult {
  accountSetTxHash?: string
  trustSetTxHash?: string
  paymentTxHash?: string
  ipfsHash?: string
  distributionWallet?: string
  error?: string
}

export default function IssuerPage() {
  // Form state
  const [projectName, setProjectName] = useState('')
  const [tokenTicker, setTokenTicker] = useState('')
  const [amount, setAmount] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  // Transaction state
  const [status, setStatus] = useState<MintStatus>('idle')
  const [result, setResult] = useState<MintResult>({})

  // Get wallet from our XRPLProvider
  const { address, isConnected, getClient, getWallet } = useWallet()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    } else {
      alert('Please upload a PDF file')
    }
  }

  const handleMint = useCallback(async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    const wallet = getWallet()
    if (!wallet) {
      alert('Wallet not available')
      return
    }

    if (!projectName || !tokenTicker || !amount || !pdfFile) {
      alert('Please fill in all fields and upload a PDF')
      return
    }

    const mintAmount = parseFloat(amount)
    if (isNaN(mintAmount) || mintAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setStatus('uploading')
    setResult({})

    let client: xrpl.Client | null = null

    try {
      // Step 1: Upload to IPFS (mocked)
      const ipfsHash = await mockUploadToIPFS(pdfFile)
      setResult((prev) => ({ ...prev, ipfsHash }))

      // Step 2: Connect to XRPL
      client = await getClient()

      // Step 3: Create AccountSet transaction to set Domain
      setStatus('setting-domain')
      
      // Create metadata URL and convert to hex
      const metadataUrl = `ipfs://${ipfsHash}`
      const domainHex = stringToHex(metadataUrl)

      const accountSetTx = {
        TransactionType: 'AccountSet' as const,
        Account: address,
        Domain: domainHex,
      }

      // Autofill, sign, and submit
      const preparedAccountSet = await client.autofill(accountSetTx)
      const signedAccountSet = wallet.sign(preparedAccountSet)
      const accountSetResult = await client.submitAndWait(signedAccountSet.tx_blob)
      
      const accountSetTxHash = accountSetResult.result.hash
      setResult((prev) => ({ ...prev, accountSetTxHash }))

      // Step 4: Create a distribution wallet and fund it
      setStatus('creating-distribution')
      
      const fundResult = await client.fundWallet()
      const distributionWallet = fundResult.wallet
      setResult((prev) => ({ ...prev, distributionWallet: distributionWallet.address }))
      
      console.log(`[Distribution] Created wallet: ${distributionWallet.address}`)

      // Step 5: Set up trust line from distribution wallet to issuer
      setStatus('setting-trustline')
      
      const formattedCurrency = formatCurrencyCode(tokenTicker)
      
      const trustSetTx = {
        TransactionType: 'TrustSet' as const,
        Account: distributionWallet.address,
        LimitAmount: {
          currency: formattedCurrency,
          issuer: address, // Trust the issuer (connected wallet)
          value: '1000000000', // High limit for the trust line
        },
      }

      // Sign with distribution wallet and submit
      const preparedTrustSet = await client.autofill(trustSetTx)
      const signedTrustSet = distributionWallet.sign(preparedTrustSet)
      const trustSetResult = await client.submitAndWait(signedTrustSet.tx_blob)
      
      const trustSetTxHash = trustSetResult.result.hash
      setResult((prev) => ({ ...prev, trustSetTxHash }))
      
      console.log(`[TrustSet] TX Hash: ${trustSetTxHash}`)

      // Step 6: Create Payment transaction to "mint" tokens
      setStatus('minting')

      const paymentTx = {
        TransactionType: 'Payment' as const,
        Account: address,
        Destination: distributionWallet.address,
        Amount: {
          currency: formattedCurrency,
          value: amount,
          issuer: address, // The issuer is the connected wallet
        },
      }

      // Autofill, sign with issuer wallet, and submit
      const preparedPayment = await client.autofill(paymentTx)
      const signedPayment = wallet.sign(preparedPayment)
      const paymentResult = await client.submitAndWait(signedPayment.tx_blob)

      const paymentTxHash = paymentResult.result.hash
      setResult((prev) => ({ ...prev, paymentTxHash }))

      setStatus('success')
    } catch (error) {
      console.error('Minting error:', error)
      setStatus('error')
      setResult((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }))
    } finally {
      if (client) {
        await client.disconnect()
      }
    }
  }, [isConnected, address, getClient, getWallet, projectName, tokenTicker, amount, pdfFile])

  const resetForm = () => {
    setProjectName('')
    setTokenTicker('')
    setAmount('')
    setPdfFile(null)
    setStatus('idle')
    setResult({})
  }

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-carbon-800">🌿 CarbonLedger</h1>
            <p className="text-carbon-600">Issuer Portal - RWA Token Minting</p>
          </div>
          <WalletConnectButton />
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Issue Carbon Credits
          </h2>

          {/* Form */}
          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Amazon Reforestation Q1 2026"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carbon-500 focus:border-transparent transition-all"
                disabled={status !== 'idle'}
              />
            </div>

            {/* Token Ticker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Ticker
              </label>
              <input
                type="text"
                value={tokenTicker}
                onChange={(e) => setTokenTicker(e.target.value.toUpperCase())}
                placeholder="e.g., CO2-AMZ"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carbon-500 focus:border-transparent transition-all"
                disabled={status !== 'idle'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Use 3 characters for standard codes, or longer for custom tokens
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (Tons of CO₂)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 1000"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carbon-500 focus:border-transparent transition-all"
                disabled={status !== 'idle'}
              />
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audit Report (PDF)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-carbon-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                  disabled={status !== 'idle'}
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer"
                >
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2 text-carbon-600">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">{pdfFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <svg
                        className="w-12 h-12 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p>Click to upload or drag and drop</p>
                      <p className="text-xs">PDF files only</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Mint Button */}
            <button
              onClick={handleMint}
              disabled={!isConnected || status !== 'idle'}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                !isConnected || status !== 'idle'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-carbon-600 hover:bg-carbon-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {!isConnected ? (
                'Connect Wallet to Mint'
              ) : status === 'idle' ? (
                '🌱 Mint Carbon Tokens'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {status === 'uploading' && 'Uploading to IPFS...'}
                  {status === 'setting-domain' && 'Setting Domain...'}
                  {status === 'creating-distribution' && 'Creating Distribution Wallet...'}
                  {status === 'setting-trustline' && 'Setting Trust Line...'}
                  {status === 'minting' && 'Minting Tokens...'}
                </span>
              )}
            </button>
          </div>

          {/* Success Result */}
          {status === 'success' && (
            <div className="mt-6 p-6 bg-carbon-50 rounded-xl border border-carbon-200">
              <div className="flex items-center gap-2 text-carbon-700 font-semibold mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Tokens Minted Successfully!
              </div>

              <div className="space-y-3 text-sm">
                {result.ipfsHash && (
                  <div>
                    <span className="text-gray-600">IPFS Hash:</span>
                    <code className="ml-2 px-2 py-1 bg-white rounded text-xs">
                      {result.ipfsHash}
                    </code>
                  </div>
                )}
                
                {result.accountSetTxHash && (
                  <div>
                    <span className="text-gray-600">AccountSet TX:</span>
                    <a
                      href={`${DEVNET_EXPLORER_URL}/${result.accountSetTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-carbon-600 hover:text-carbon-800 underline"
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                )}

                {result.distributionWallet && (
                  <div>
                    <span className="text-gray-600">Distribution Wallet:</span>
                    <code className="ml-2 px-2 py-1 bg-white rounded text-xs">
                      {result.distributionWallet}
                    </code>
                  </div>
                )}

                {result.trustSetTxHash && (
                  <div>
                    <span className="text-gray-600">TrustSet TX:</span>
                    <a
                      href={`${DEVNET_EXPLORER_URL}/${result.trustSetTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-carbon-600 hover:text-carbon-800 underline"
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                )}
                
                {result.paymentTxHash && (
                  <div>
                    <span className="text-gray-600">Payment TX:</span>
                    <a
                      href={`${DEVNET_EXPLORER_URL}/${result.paymentTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-carbon-600 hover:text-carbon-800 underline"
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={resetForm}
                className="mt-4 px-4 py-2 text-sm text-carbon-600 hover:text-carbon-800 font-medium"
              >
                ← Mint Another Token
              </button>
            </div>
          )}

          {/* Error Result */}
          {status === 'error' && (
            <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Minting Failed
              </div>
              <p className="text-red-600 text-sm">{result.error}</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                ← Try Again
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">ℹ️ How it works</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Upload your audit report (stored on IPFS)</li>
              <li>IPFS hash is linked to your wallet via AccountSet</li>
              <li>A distribution wallet is created and funded</li>
              <li>Trust line is set up from distribution wallet to issuer</li>
              <li>Tokens are minted and sent to the distribution wallet</li>
              <li>Tokens can then be listed on the marketplace</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Connected to XRPL Devnet • Built for NUS Fintech Summit 2026
        </p>
      </div>
    </main>
  )
}
