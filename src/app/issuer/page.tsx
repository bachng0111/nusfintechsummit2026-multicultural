'use client'

import { useState, useCallback } from 'react'
import { WalletConnectButton, useWallet } from '@/components/XRPLProvider'
import * as xrpl from 'xrpl'
// XRPL Devnet configuration
const DEVNET_EXPLORER_URL = 'https://devnet.xrpl.org'

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
 * Encode MPToken metadata using official xrpl.js function
 * This ensures proper XLS-89 compliance
 */
function encodeMPTokenMetadata(metadata: Record<string, unknown>): string {
  // Use the official xrpl.js encoding function if available
  if ('encodeMPTokenMetadata' in xrpl) {
    return (xrpl as any).encodeMPTokenMetadata(metadata)
  }
  
  // Fallback to manual encoding
  const keyMap: Record<string, string> = {
    ticker: 't',
    name: 'n', 
    desc: 'd',
    icon: 'i',
    asset_class: 'ac',
    asset_subclass: 'as',
    issuer_name: 'in',
    uris: 'u',
    additional_info: 'ai',
  }

  const compactMetadata: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    const compactKey = keyMap[key] || key
    compactMetadata[compactKey] = value
  }

  const jsonString = JSON.stringify(compactMetadata)
  let hex = ''
  for (let i = 0; i < jsonString.length; i++) {
    hex += jsonString.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return hex.toUpperCase()
}

type MintStatus = 'idle' | 'uploading' | 'creating-mpt' | 'success' | 'error'

interface MintResult {
  mptIssuanceId?: string
  txHash?: string
  ipfsHash?: string
  error?: string
}

// MPTokenIssuanceCreate flags
const MPT_CAN_TRANSFER = 0x00000020
const MPT_CAN_TRADE = 0x00000010

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

    // Validate ticker (max 6 chars, uppercase alphanumeric recommended)
    if (tokenTicker.length > 6) {
      alert('Token ticker should be max 6 characters')
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

      // Step 3: Create MPTokenIssuanceCreate transaction
      setStatus('creating-mpt')

      // Build metadata following XLS-89 schema
      const mptMetadata = {
        ticker: tokenTicker.toUpperCase(),
        name: projectName,
        desc: `Carbon credit token for ${projectName}. Audit report available via IPFS.`,
        icon: 'https://example.org/carbon-icon.png',
        asset_class: 'rwa',
        asset_subclass: 'other',
        issuer_name: 'CarbonLedger',
        uris: [
          {
            uri: `ipfs://${ipfsHash}`,
            category: 'docs',
            title: 'Audit Report'
          },
          {
            uri: 'https://carbonledger.example.com',
            category: 'website', 
            title: 'CarbonLedger Platform'
          }
        ],
        additional_info: {
          carbon_tons: amount,
          project_name: projectName,
          verification_date: new Date().toISOString().split('T')[0],
          standard: 'VCS',
          methodology: 'VM0007',
          registry: 'Verra'
        }
      }

      // Encode metadata to hex
      const mptMetadataHex = encodeMPTokenMetadata(mptMetadata)
      
      // Check metadata size (1024 byte limit)
      if (mptMetadataHex.length / 2 > 1024) {
        throw new Error('Metadata exceeds 1024 byte limit. Please shorten project name or description.')
      }

      console.log('[MPT] Encoded metadata hex:', mptMetadataHex)
      console.log('[MPT] Metadata size:', mptMetadataHex.length / 2, 'bytes')

      // Convert amount to integer (using AssetScale of 2 for carbon credits)
      // e.g., 1000 tons becomes 100000 (with 2 decimal places)
      const maxAmount = Math.floor(mintAmount * 100).toString()

      // Create MPTokenIssuanceCreate transaction
      const mptIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate' as const,
        Account: address,
        AssetScale: 2, // 2 decimal places for carbon credits
        MaximumAmount: maxAmount,
        TransferFee: 0, // No transfer fee
        Flags:  MPT_CAN_TRANSFER | MPT_CAN_TRADE,
        MPTokenMetadata: mptMetadataHex
      }

      console.log('[MPT] Transaction:', JSON.stringify(mptIssuanceCreate, null, 2))

      // Autofill, sign, and submit
      const prepared = await client.autofill(mptIssuanceCreate)
      const signed = wallet.sign(prepared)
      const submitResponse = await client.submitAndWait(signed.tx_blob)

      console.log('[MPT] Submit response:', JSON.stringify(submitResponse.result, null, 2))

      // Check if transaction succeeded
      const txResult = (submitResponse.result.meta as { TransactionResult?: string })?.TransactionResult
      if (txResult !== 'tesSUCCESS') {
        throw new Error(`Transaction failed with result: ${txResult}`)
      }

      // Get the MPT issuance ID from the response
      const mptIssuanceId = (submitResponse.result.meta as { mpt_issuance_id?: string })?.mpt_issuance_id
      const txHash = submitResponse.result.hash

      setResult((prev) => ({
        ...prev,
        mptIssuanceId,
        txHash
      }))

      console.log(`[MPT] Created successfully with issuance ID: ${mptIssuanceId}`)

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
            <p className="text-carbon-600">Issuer Portal - MPT Token Issuance</p>
          </div>
          <WalletConnectButton />
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Issue Carbon Credits (MPT)
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
                onChange={(e) => setTokenTicker(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="e.g., CO2AMZ"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carbon-500 focus:border-transparent transition-all"
                disabled={status !== 'idle'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Max 6 characters, uppercase letters and digits only (e.g., CO2AMZ)
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Supply (Tons of CO₂)
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
                'Connect Wallet to Issue'
              ) : status === 'idle' || status === 'success' || status === 'error' ? (
                '🌱 Issue Carbon Token (MPT)'
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
                  {status === 'creating-mpt' && 'Creating MPT Issuance...'}
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
                MPT Issued Successfully!
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

                {result.mptIssuanceId && (
                  <div>
                    <span className="text-gray-600">MPT Issuance ID:</span>
                    <a
                      href={`${DEVNET_EXPLORER_URL}/mpt/${result.mptIssuanceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-carbon-600 hover:text-carbon-800 underline"
                    >
                      {result.mptIssuanceId.slice(0, 16)}... ↗
                    </a>
                  </div>
                )}
                
                {result.txHash && (
                  <div>
                    <span className="text-gray-600">Transaction:</span>
                    <a
                      href={`${DEVNET_EXPLORER_URL}/transactions/${result.txHash}`}
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
                ← Issue Another Token
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
                Issuance Failed
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
            <h3 className="font-medium text-blue-800 mb-2">ℹ️ How MPT Issuance Works</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Upload your audit report (stored on IPFS)</li>
              <li>Metadata is encoded following XLS-89 standard</li>
              <li>MPTokenIssuanceCreate transaction is submitted</li>
              <li>Token is created with transferable & tradeable flags</li>
              <li>Holders can authorize and receive tokens via MPTokenAuthorize</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              Note: MPT requires 0.2 XRP owner reserve per issuance
            </p>
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