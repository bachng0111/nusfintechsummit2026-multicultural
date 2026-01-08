# VerdeX – RWA Tokenization for Carbon Credits on XRPL

> **A transparent, trust-minimized carbon credit marketplace built on the XRP Ledger (XRPL)**

**Hackathon**: NUS FinTech Summit 2026 – Ripple XRPL Challenge  
**Bounty Track**: BGA (Blockchain for Good & SDGs), Ripple Bounty: Feedback Challenge
**Submission Deadline**: Jan 9, 2026 – 9:00 AM (SGT)

**Team Members**

- Nguyen Bach
- Zeng Zheqi
- Toh Cheng Hee Adriel
- Dong Jingling
- To Bao Chau

**Telegram Contact**: `@beckng`

---

## Overview

**VerdeX** is a **Minimum Viable Product (MVP)** that demonstrates how **carbon credits can be tokenized as real-world assets (RWAs)** on the **XRP Ledger (XRPL)**.

By representing each carbon credit as a **native XRPL issued asset with verifiable metadata**, VerdeX replaces opaque, off-chain registries with a **transparent, on-chain lifecycle** covering:

- Issuance
- Purchase
- Retirement (burning)

All actions are **publicly verifiable**, **tamper-proof**, and **settled on-chain**, enabling a more credible and efficient carbon market.

---

## Current Problem

The global carbon credit market suffers from fundamental issues that limit its effectiveness and credibility:

- Carbon credits are traded through **fragmented registries and intermediaries**
- Records are maintained **off-chain** (PDFs, spreadsheets, proprietary databases)
- Buyers cannot easily verify:
  - The origin of a credit
  - Ownership history
  - Whether a credit has already been retired
- This opacity enables:
  - **Double counting**
  - **Greenwashing**
- Heavy reliance on brokers and manual processes results in:
  - High transaction costs
  - Slow settlement
  - Low liquidity, especially for SMEs

---

## Proposed Solution

We propose **tokenizing carbon credits as Real-World Assets (RWAs) on the XRP Ledger (XRPL)**.

Each carbon credit is represented as a **native XRPL issued token** with embedded metadata describing the underlying project, location, registry reference, and vintage year. Ownership, transfers, and retirement are all recorded **directly on-chain**, creating an immutable and auditable record of climate impact. On-chain retirement mechanisms ensure that each credit can only be used once, preventing double counting by design.

---

## How It Works

1. **Issuance**  
   A project issuer mints carbon credits on XRPL as issued assets with embedded metadata.

2. **Trading**  
   Buyers purchase and trade carbon credits on the VerdeX marketplace using **XRP**.

3. **Retirement**  
   When a carbon credit is used to offset emissions, the corresponding token is permanently retired on-chain.

4. **Verification**  
   The full lifecycle of each carbon credit is publicly verifiable through XRPL transactions and visualized in the dashboard.

---

## System Architecture

```text
Web Frontend
  │
  │  XRPL SDK
  ▼
Backend Services
  │
  ▼
XRP Ledger (XRPL Testnet)
 ├── Issued Assets (Carbon Credits)
 ├── XRP Payments using XRPL Escrow
 └── Retirement Address
```

## XRPL Accounts & Features

### Issuer Accounts

**Role:** Carbon credit creation and listing

**Features:**

- XRPL **Issuer Account**
- Token issuance via a single button click
- Minting **multi-purpose carbon credit tokens** (MPTokens)
- Metadata referenced on-chain via XRPL transaction memos
- Each issued token represents **a specified number of unit(s) of carbon offset**

---

### Buyer Accounts

**Role:** Purchasing, holding, and retiring carbon credits

**Features:**

- Maintain **XRP balance**
- Purchase listed carbon credit tokens using **XRP**
- Account overview:
  - Owned active tokens
  - Retired (burned) tokens
- **Carbon Credit Retirement Function**
  - Tokens are transferred to a designated XRPL retirement address
  - Prevents reuse or resale by design

---

## Dashboard & Token Information

### Lifecycle Dashboard

- Visualizes the full lifecycle of each carbon credit:
  - Issuance details
  - Trading history
  - Retirement status
- All data derived from **public XRPL transactions**
- Provides an immutable audit trail for verification

### Token Information Page

- Token metadata (project details, vintage year)
- Current ownership status
- Complete transaction history
- Retirement proof

---

## MVP Scope

For the hackathon MVP, we focus on demonstrating the **full on-chain lifecycle of carbon credits** on XRPL.

### Included in MVP

- Multiple Purpose Token issuance
- XRP-based payment transactions
- Conditional transaction via escrow
- Local carbon credit retirement (burn / transfer)
- Public lifecycle visualization dashboard

### Out of Scope

- Real-world carbon measurement
- Regulatory certification
- Full KYC / compliance integration

---

## XRPL Features Used (Key Scoring Section)

- **XRPL Accounts** – Separate issuer and buyer accounts with distinct roles
- **Issued MPTokens** – Carbon credits represented as native XRPL tokens
- **Transaction Memos** – JSON metadata embedded on-chain
- **XRPL Escrow** – Conditional XRP settlement requiring issuer approval before asset transfer
- **Token Retirement** – Transfer to a designated retirement address to prevent double counting

---

## XRPL Key Features Used

VerdeX is built entirely using **XRPL-native primitives**, without relying on smart contracts or off-chain enforcement. The following XRPL features are core to the system design:

### XRPL Accounts (Role-Based Architecture)

We use multiple XRPL accounts with clearly defined roles:

- **Issuer Accounts**: Responsible for minting carbon credit tokens and embedding metadata.
- **Buyer Accounts**: Hold XRP, purchase carbon credits, and trigger retirement.
- **Retirement Address**: A designated, unspendable XRPL address used to permanently retire tokens.

This separation of concerns ensures transparency, security, and clear lifecycle boundaries for each carbon credit.

---

### Multi-Purpose Tokens (Issued Assets with Metadata)

Each carbon credit is represented as a **multi-purpose XRPL issued asset**.

- Tokens are issued by an issuer account
- Each token represents **one unit of carbon offset**
- Metadata describing the underlying carbon project is embedded using:
  - On-chain transaction memos (JSON)
  - Off-chain JSON referenced by hash
- Metadata includes:
  - Project ID
  - Project location
  - Vintage year
  - Registry reference (simulated for MVP)

This design allows a single token type to support multiple lifecycle stages: issuance → trading → escrow → retirement.

---

### Escrow (Conditional Asset Control)

We use **XRPL Escrow transactions** to demonstrate conditional control over carbon credit tokens.

- Escrows can be used to:
  - Temporarily lock tokens during a transaction flow
  - Ensure atomic settlement conditions
  - Prevent premature transfers
- Escrow release conditions are enforced directly by XRPL

This mechanism showcases how XRPL can support **trust-minimized conditional flows** without smart contracts.

---

### On-Chain Carbon Credit Retirement

Carbon credit retirement is triggered explicitly when a buyer redeems a credit.

- Upon redemption, the token is transferred to a **designated XRPL retirement address**
- This action permanently removes the token from circulation
- The retirement event is:
  - Public
  - Immutable
  - Verifiable on-chain

Retirement transaction is confirmed on-chain and can be verified, ensuring that double counting is prevented by design.

---

## Demo Video

**Demo Link**: https://youtube.com/your-demo-link

The demo video includes:

- Wallet connection
- Carbon credit issuance
- Carbon credit purchase
- Carbon credit retirement
- Dashboard walkthrough

---

## Repository Structure

```text
.
├── frontend/
├── backend/
├── dashboard/
├── scripts/
└── README.md
```

## Hackathon Rubric Alignment

### Ripple XRPL Challenge

| Criterion          | How VerdeX Addresses It                 |
| ------------------ | --------------------------------------- |
| Business Potential | Real-world carbon market infrastructure |
| Creativity         | XRPL-native asset lifecycle design      |
| Use of XRPL        | Escrow, MPTokens, retirement            |
| Completeness       | Fully testable end-to-end MVP           |

---

## BGA Bounty – SDG Alignment

**Primary UN SDG:**

- **SDG 13 – Climate Action**

**Why VerdeX Qualifies for BGA:**

- **Transparency** – Immutable XRPL records prevent fraud
- **Traceability** – End-to-end tracking of carbon credits
- **Security** – On-chain asset lifecycle eliminates double spending
- **Sustainability** – Enables credible carbon offsetting

---

## BGA Rubric Mapping

| Rubric                             | Explanation                               |
| ---------------------------------- | ----------------------------------------- |
| Social Impact (30%)                | Verifiable, transparent carbon offsetting |
| Technical Implementation (20%)     | XRPL-native token lifecycle               |
| Innovation (20%)                   | On-chain retirement & certificates        |
| Sustainability & Scalability (20%) | Low-cost, global XRPL infrastructure      |
| Presentation (10%)                 | Live demo + lifecycle dashboard           |

---

## Future Roadmap

- RLUSD integration
- Transition to Mainnet
- DID integration for issuer verification
- Integration with real carbon registries
- Compliance-aware certificate issuance
- Institutional and enterprise onboarding

---

## Contact

**Telegram**: `@beckng`  
**Email**: e0969877@u.nus.edu
