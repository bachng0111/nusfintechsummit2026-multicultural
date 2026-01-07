# 🏗️ CarbonLedger - Software Architecture & Workflow

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Workflow Diagrams](#workflow-diagrams)
- [API & Transaction Specifications](#api--transaction-specifications)
- [Security Considerations](#security-considerations)

---

## Overview

**CarbonLedger** is a decentralized Real World Asset (RWA) marketplace for carbon credits built on the XRP Ledger (XRPL). The platform enables project owners (Issuers) to tokenize verified carbon credits as blockchain-based assets, providing transparency, traceability, and liquidity for environmental assets.

### Key Objectives
- 🌱 **Tokenization**: Convert real-world carbon credits into XRPL tokens
- 📄 **Verification**: Link audit reports via IPFS for transparency
- 🔗 **Decentralization**: Leverage XRPL for trustless transactions
- 🛒 **Marketplace**: Enable trading of carbon credit tokens (future)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   Home Page     │    │  Issuer Portal  │    │   Marketplace   │        │
│   │   (page.tsx)    │    │ (/issuer/page)  │    │    (future)     │        │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                          │
│                    ┌──────────────┴──────────────┐                          │
│                    │      XRPLProvider           │                          │
│                    │   (Context & Wallet Mgmt)   │                          │
│                    └──────────────┬──────────────┘                          │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼──────────────────────────────────────────┐
│                          INTEGRATION LAYER                                   │
├───────────────────────────────────┼──────────────────────────────────────────┤
│                                   │                                          │
│     ┌─────────────────────────────┼─────────────────────────────┐           │
│     │                             │                             │           │
│     ▼                             ▼                             ▼           │
│ ┌─────────┐              ┌─────────────────┐           ┌─────────────┐      │
│ │  xrpl   │              │   XRPL Devnet   │           │    IPFS     │      │
│ │  .js    │◄────────────►│   WebSocket     │           │  (Pinata)   │      │
│ │ Library │              │    Server       │           │   Storage   │      │
│ └─────────┘              └─────────────────┘           └─────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼──────────────────────────────────────────┐
│                           BLOCKCHAIN LAYER                                   │
├───────────────────────────────────┼──────────────────────────────────────────┤
│                                   │                                          │
│                    ┌──────────────┴──────────────┐                          │
│                    │                             │                          │
│                    │     XRP LEDGER (Devnet)     │                          │
│                    │                             │                          │
│                    │  ┌─────────────────────┐   │                          │
│                    │  │   Issuer Account    │   │                          │
│                    │  │  - Domain Field     │   │                          │
│                    │  │  - Token Issuance   │   │                          │
│                    │  └──────────┬──────────┘   │                          │
│                    │             │              │                          │
│                    │             ▼              │                          │
│                    │  ┌─────────────────────┐   │                          │
│                    │  │  Standby Wallet     │   │                          │
│                    │  │ (Distribution Acct) │   │                          │
│                    │  └─────────────────────┘   │                          │
│                    │                             │                          │
│                    └─────────────────────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | React framework with App Router |
| **React** | 18.x | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.4.x | Utility-first styling |

### Blockchain Integration
| Technology | Version | Purpose |
|------------|---------|---------|
| **xrpl.js** | 4.1.x | XRPL JavaScript SDK |
| **XRPL Devnet** | - | Test network for development |

### Storage
| Technology | Purpose |
|------------|---------|
| **IPFS** | Decentralized file storage |
| **Pinata** | IPFS pinning service |

### Network Configuration
```
XRPL Devnet WebSocket: wss://s.devnet.rippletest.net:51233
XRPL Devnet Explorer: https://devnet.xrpl.org
```

---

## Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with XRPLProvider
│   ├── page.tsx                 # Landing page (/)
│   ├── globals.css              # Global styles
│   └── issuer/
│       └── page.tsx             # Issuer Portal (/issuer)
│
└── components/
    └── XRPLProvider.tsx         # Wallet context & management
```

### Component Breakdown

#### 1. XRPLProvider (`components/XRPLProvider.tsx`)
**Purpose**: Central wallet management and XRPL connectivity

```typescript
interface WalletContextType {
  address: string | null         // Connected wallet address
  seed: string | null            // Wallet seed (for signing)
  balance: string | null         // XRP balance
  isConnected: boolean           // Connection status
  isConnecting: boolean          // Loading state
  connectNewWallet: () => Promise<void>    // Create new funded wallet
  connectFromSeed: (seed: string) => Promise<void>  // Import existing
  disconnect: () => void         // Disconnect wallet
  getClient: () => Promise<xrpl.Client>    // Get XRPL client
  getWallet: () => xrpl.Wallet | null      // Get wallet instance
}
```

**Key Features**:
- React Context API for global state
- XRPL Devnet faucet integration
- Wallet creation and import
- Client connection management

#### 2. Issuer Page (`app/issuer/page.tsx`)
**Purpose**: RWA token minting interface

**State Management**:
```typescript
// Form State
projectName: string      // Carbon project name
tokenTicker: string      // Token currency code
amount: string           // Token amount to mint
pdfFile: File | null     // Audit report file

// Transaction State
status: MintStatus       // 'idle' | 'uploading' | 'setting-domain' | 'minting' | 'success' | 'error'
result: MintResult       // Transaction hashes and IPFS hash
```

**Helper Functions**:
- `mockUploadToIPFS()` - Simulates IPFS upload (returns dummy CID)
- `stringToHex()` - Converts string to hex for XRPL Domain field
- `formatCurrencyCode()` - Formats token ticker (3 chars or 40 hex chars)

---

## Data Flow

### Wallet Connection Flow

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │     │ WalletConnect│     │ XRPLProvider│     │ XRPL Devnet  │
│         │     │   Button     │     │   Context   │     │   Faucet     │
└────┬────┘     └──────┬───────┘     └──────┬──────┘     └──────┬───────┘
     │                 │                    │                   │
     │ Click "Get      │                    │                   │
     │ Test Wallet"    │                    │                   │
     │────────────────►│                    │                   │
     │                 │                    │                   │
     │                 │ connectNewWallet() │                   │
     │                 │───────────────────►│                   │
     │                 │                    │                   │
     │                 │                    │ client.fundWallet()
     │                 │                    │──────────────────►│
     │                 │                    │                   │
     │                 │                    │◄──────────────────│
     │                 │                    │   Funded Wallet   │
     │                 │                    │                   │
     │                 │◄───────────────────│                   │
     │                 │   Wallet Address   │                   │
     │                 │   + Balance        │                   │
     │◄────────────────│                    │                   │
     │  UI Updated     │                    │                   │
     │                 │                    │                   │
```

### Token Minting Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │     │ Issuer Page │     │    IPFS     │     │ XRPL Devnet  │
│         │     │             │     │  (Pinata)   │     │              │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬───────┘
     │                 │                   │                   │
     │ 1. Fill Form    │                   │                   │
     │    & Upload PDF │                   │                   │
     │────────────────►│                   │                   │
     │                 │                   │                   │
     │ 2. Click Mint   │                   │                   │
     │────────────────►│                   │                   │
     │                 │                   │                   │
     │                 │ 3. Upload PDF     │                   │
     │                 │──────────────────►│                   │
     │                 │                   │                   │
     │                 │◄──────────────────│                   │
     │                 │   IPFS CID Hash   │                   │
     │                 │                   │                   │
     │                 │ 4. AccountSet TX  │                   │
     │                 │   (Set Domain)    │                   │
     │                 │───────────────────┼──────────────────►│
     │                 │                   │                   │
     │                 │◄──────────────────┼───────────────────│
     │                 │   TX Hash         │                   │
     │                 │                   │                   │
     │                 │ 5. Payment TX     │                   │
     │                 │   (Mint Tokens)   │                   │
     │                 │───────────────────┼──────────────────►│
     │                 │                   │                   │
     │                 │◄──────────────────┼───────────────────│
     │                 │   TX Hash         │                   │
     │                 │                   │                   │
     │◄────────────────│                   │                   │
     │  Success!       │                   │                   │
     │  (Both TX Hashes│                   │                   │
     │   + IPFS Hash)  │                   │                   │
```

---

## Workflow Diagrams

### Complete Minting Workflow

```
                              START
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Connect Wallet     │
                    │  (Devnet Faucet)      │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Fill Form Data     │
                    │  - Project Name       │
                    │  - Token Ticker       │
                    │  - Amount             │
                    │  - Upload PDF         │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Click "Mint"        │
                    └───────────┬───────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │  STEP 1: Upload PDF to IPFS         │
              │                                     │
              │  Input: PDF File                    │
              │  Output: IPFS CID Hash              │
              │  (e.g., QmT5NvUtoM5nWFfrQdVr...)   │
              └─────────────────┬───────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │  STEP 2: Build Metadata URL         │
              │                                     │
              │  Format: ipfs://{CID}               │
              │  Convert to HEX for XRPL            │
              └─────────────────┬───────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │  STEP 3: AccountSet Transaction     │
              │                                     │
              │  {                                  │
              │    TransactionType: "AccountSet"   │
              │    Account: {issuer_address}       │
              │    Domain: {metadata_url_hex}      │
              │  }                                  │
              │                                     │
              │  → Sign with Wallet                 │
              │  → Submit to XRPL                   │
              └─────────────────┬───────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │  STEP 4: Payment Transaction        │
              │                                     │
              │  {                                  │
              │    TransactionType: "Payment"      │
              │    Account: {issuer_address}       │
              │    Destination: {standby_wallet}   │
              │    Amount: {                       │
              │      currency: {token_ticker}      │
              │      value: {amount}               │
              │      issuer: {issuer_address}      │
              │    }                               │
              │  }                                  │
              │                                     │
              │  → Sign with Wallet                 │
              │  → Submit to XRPL                   │
              └─────────────────┬───────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │       SUCCESS!        │
                    │                       │
                    │  - IPFS Hash          │
                    │  - AccountSet TX Hash │
                    │  - Payment TX Hash    │
                    └───────────────────────┘
```

### State Machine

```
                    ┌─────────────┐
          ┌────────►│    IDLE     │◄────────┐
          │         └──────┬──────┘         │
          │                │                │
          │         Form Submit             │
          │                │                │
          │                ▼                │
          │         ┌─────────────┐         │
          │         │  UPLOADING  │         │
          │         │  (IPFS)     │         │
          │         └──────┬──────┘         │
          │                │                │
        Reset         Success/Fail         Reset
          │                │                │
          │                ▼                │
          │         ┌─────────────┐         │
          │         │SETTING-     │         │
          │         │DOMAIN       │         │
          │         └──────┬──────┘         │
          │                │                │
          │           Success/Fail          │
          │                │                │
          │                ▼                │
          │         ┌─────────────┐         │
          │         │  MINTING    │         │
          │         │  (Payment)  │         │
          │         └──────┬──────┘         │
          │                │                │
          │        ┌───────┴───────┐        │
          │        │               │        │
          │        ▼               ▼        │
          │  ┌─────────┐     ┌─────────┐    │
          └──│ SUCCESS │     │  ERROR  │────┘
             └─────────┘     └─────────┘
```

---

## API & Transaction Specifications

### XRPL Transactions Used

#### 1. AccountSet Transaction
Sets the `Domain` field to link IPFS metadata to the issuer account.

```typescript
{
  TransactionType: 'AccountSet',
  Account: '<issuer_wallet_address>',
  Domain: '<hex_encoded_ipfs_url>'  // e.g., ipfs://QmHash... → hex
}
```

#### 2. Payment Transaction (Token Issuance)
Creates/mints custom tokens by sending them to a distribution wallet.

```typescript
{
  TransactionType: 'Payment',
  Account: '<issuer_wallet_address>',
  Destination: '<standby_wallet_address>',  // rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe
  Amount: {
    currency: '<currency_code>',  // 3 chars or 40 hex chars
    value: '<amount>',
    issuer: '<issuer_wallet_address>'
  }
}
```

### Currency Code Formatting

| Input | Output Format | Notes |
|-------|---------------|-------|
| `CO2` | `CO2` | 3-char standard format |
| `CO2-AMZ` | `434F322D414D5A000000000000000000000000000000` | Hex-padded to 40 chars |

### IPFS Integration

```typescript
// Metadata URL Construction
const ipfsHash = 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX'
const metadataUrl = `ipfs://${ipfsHash}`

// Hex Encoding for XRPL Domain Field
const domainHex = stringToHex(metadataUrl)
// Result: '697066733A2F2F516D54354E7655746F4D356E57466672516456724674764766...'
```

---

## Security Considerations

### Current Implementation (Devnet)
- ⚠️ Wallet seeds are stored in browser memory (client-side only)
- ⚠️ Uses XRPL Devnet faucet for test wallets
- ⚠️ IPFS upload is mocked (returns dummy CID)

### Production Recommendations

| Area | Current | Production |
|------|---------|------------|
| **Wallet** | In-memory seed | Hardware wallet / Xumm / CrossMark integration |
| **Network** | Devnet | Mainnet with proper security |
| **IPFS** | Mock upload | Real Pinata integration with JWT |
| **Keys** | Exposed in browser | Server-side signing or wallet provider |
| **Trust Lines** | Not handled | Implement trust line setup |

### Environment Variables (Production)
```env
NEXT_PUBLIC_PINATA_JWT=<your_pinata_jwt>
NEXT_PUBLIC_GATEWAY_URL=<your_pinata_gateway>
NEXT_PUBLIC_XRPL_NETWORK=mainnet
```

---

## Future Enhancements

1. **Marketplace Module** (`/marketplace`)
   - Browse available carbon credit tokens
   - Purchase tokens with XRP
   - Order book and trading interface

2. **Buyer Wallet Integration**
   - Trust line setup automation
   - Token balance display
   - Transaction history

3. **Enhanced Verification**
   - Multi-signature issuance
   - Third-party auditor approval
   - Compliance checks

4. **Analytics Dashboard**
   - Token supply tracking
   - Trading volume metrics
   - Carbon offset calculations

---

## References

- [XRPL Documentation](https://xrpl.org/docs.html)
- [xrpl.js SDK](https://js.xrpl.org/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Pinata IPFS Pinning](https://docs.pinata.cloud/)

---

*Built for NUS Fintech Summit 2026 - Multicultural Team*
