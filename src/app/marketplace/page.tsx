'use client'

import React, { useEffect, useState } from 'react'

type Token = {
  issuanceId: string
  address: string
  metadata: any
  amount: number
  timestamp: string
  txHash: string
  explorerUrl: string
  ipfsHash: string
}

const Marketplace: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('mintedTokens')
    if (stored) {
      setTokens(JSON.parse(stored))
    }
  }, [])

  return (
    <main style={{ padding: 32 }}>
      <h1>Token Registry</h1>
      {tokens.length === 0 ? (
        <p>No tokens minted yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Issuance ID</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Address</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Amount</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Timestamp</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Explorer</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, idx) => (
              <tr key={token.issuanceId + idx}>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{token.issuanceId}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{token.address}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{token.amount}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{new Date(token.timestamp).toLocaleString()}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  <a href={token.explorerUrl} target="_blank" rel="noopener noreferrer">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

export default Marketplace