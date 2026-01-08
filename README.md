# 🌱 CarbonX – RWA Tokenization for Carbon Credits on XRPL

> **A transparent, trust-minimized carbon credit marketplace built on the XRP Ledger (XRPL)**

📌 **Hackathon**: NUS FinTech Summit 2026 – Ripple XRPL Challenge  
🏆 **Bounty Track**: BGA (Blockchain for Good & SDGs)  
📅 **Submission Deadline**: Jan 9, 2026 – 9:00 AM (SGT)

👥 **Team Members**
- Bach – Issuer Account & Token Issuance  
- Zheqi – Issuer Account & Metadata Handling  
- Adriel – Buyer Account & Trading Logic  
- Jingling – Buyer Account & Retirement Logic  
- Chau – Dashboard & Token Information Page  

📱 **Telegram Contact**: `@your_telegram_handle`

---

## 🚀 Overview

**CarbonX** is a **Minimum Viable Product (MVP)** that demonstrates how **carbon credits can be tokenized as real-world assets (RWAs)** on the **XRP Ledger (XRPL)**.

By representing each carbon credit as a **native XRPL issued asset with verifiable metadata**, CarbonX replaces opaque, off-chain registries with a **transparent, on-chain lifecycle** covering:

- Issuance  
- Trading  
- Retirement (burning)

All actions are **publicly verifiable**, **tamper-proof**, and **settled on-chain**, enabling a more credible and efficient carbon market.

---

## ❗ Current Problem

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

## 💡 Proposed Solution

We propose **tokenizing carbon credits as Real-World Assets (RWAs) on the XRP Ledger (XRPL)**.

Each carbon credit is represented as a **native XRPL issued token** with embedded metadata describing the underlying project, location, registry reference, and vintage year. Ownership, transfers, and retirement are all recorded **directly on-chain**, creating an immutable and auditable record of climate impact.

By leveraging XRPL’s **native decentralized exchange (DEX)** and **RLUSD**, carbon credits can be traded peer-to-peer without centralized intermediaries. On-chain retirement mechanisms ensure that each credit can only be used once, preventing double counting by design.

---

## 🧠 How It Works

1. **Issuance**  
   A project issuer mints carbon credits on XRPL as issued assets with embedded metadata.

2. **Trading**  
   Buyers purchase and trade carbon credits on the XRPL DEX using **RLUSD**.

3. **Retirement**  
   When a carbon credit is used to offset emissions, the corresponding token is permanently retired on-chain.

4. **Verification**  
   The full lifecycle of each carbon credit is publicly verifiable through XRPL transactions and visualized in the dashboard.

---

## 🏗️ System Architecture

Web Frontend
  │
  │  XRPL SDK
  ▼
Backend Services
  │
  ▼
XRP Ledger (XRPL Testnet)
 ├── Issued Assets (Carbon Credits)
 ├── RLUSD Payments
 ├── DEX Trading
 └── Retirement Address


---

## 🔐 XRPL Accounts & Features

### 1️⃣ Issuer Accounts (Bach & Zheqi)

**Role:** Carbon credit creation and listing

**Features:**
- XRPL **Issuer Account**
- Token issuance via a single button click
- Minting **multi-purpose carbon credit tokens**
- Embedded metadata uploaded as JSON (project ID, location, vintage year, registry reference)
- Metadata referenced on-chain via XRPL transaction memos
- Connection to **CrossMark Wallet**
- Each issued token represents **one unit of carbon offset**

---

### 2️⃣ Buyer Accounts (Adriel & Jingling)

**Role:** Purchasing, holding, and retiring carbon credits

**Features:**
- Connect to **CrossMark Wallet**
- Maintain **RLUSD balance**
- Purchase listed carbon credit tokens using RLUSD
- View:
  - Owned tokens
  - Retired (burned) tokens
- **Carbon Credit Retirement Function**
  - Tokens are transferred to a designated XRPL retirement address
  - Prevents reuse or resale by design
- **Certificate Mechanism**
  - Only after retirement can a certificate be issued
  - Certificate enables further actions (e.g. construction eligibility)

---

## 📊 Dashboard & Token Information

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

## 🧪 MVP Scope

For the hackathon MVP, we focus on demonstrating the **full on-chain lifecycle** of carbon credits on XRPL.

### Included in MVP
- Carbon credit issuance (simulated)
- On-chain trading via XRPL native DEX
- RLUSD-based settlement
- Carbon credit retirement (burn / transfer)
- Public lifecycle visualization dashboard

### Out of Scope
- Real-world carbon measurement
- Regulatory certification
- Full KYC / compliance integration

---

## 🔧 XRPL Features Used (Key Scoring Section)

- **XRPL Accounts** – Separate issuer and buyer accounts with distinct roles  
- **Issued Assets** – Carbon credits represented as native XRPL tokens  
- **Transaction Memos** – JSON metadata embedded on-chain  
- **XRPL Native DEX** – Peer-to-peer trading without intermediaries  
- **RLUSD** – Stable settlement currency for real-world usage  
- **Token Retirement** – Transfer to a designated retirement address to prevent double counting  

---


---

## 🎥 Demo Video (≤ 3 Minutes)

📺 **Demo Link**: https://youtube.com/your-demo-link

The demo video includes:
- CrossMark wallet connection
- Carbon credit issuance
- RLUSD-based purchase
- Carbon credit retirement
- Dashboard walkthrough

---

## 🌐 Deployed Application (Optional)

🔗 https://your-app-url.com

---

## 📂 Repository Structure

.
├── frontend/
├── backend/
├── dashboard/
├── scripts/
└── README.md



---

## 🎯 Hackathon Rubric Alignment

### Ripple XRPL Challenge

| Criterion | How CarbonX Addresses It |
|--------|---------------------------|
| Business Potential | Real-world carbon market infrastructure |
| Creativity | XRPL-native asset lifecycle design |
| Use of XRPL | Issued assets, DEX, RLUSD, retirement |
| Completeness | Fully testable end-to-end MVP |

---

## 🌍 BGA Bounty – SDG Alignment

**Primary UN SDG:**  
- **SDG 13 – Climate Action**

**Why CarbonX Qualifies for BGA:**
- **Transparency** – Immutable XRPL records prevent fraud  
- **Traceability** – End-to-end tracking of carbon credits  
- **Security** – On-chain asset lifecycle eliminates double spending  
- **Sustainability** – Enables credible carbon offsetting  

---

## 🏆 BGA Rubric Mapping

| Rubric | Explanation |
|-----|-------------|
| Social Impact (30%) | Verifiable, transparent carbon offsetting |
| Technical Implementation (20%) | XRPL-native token lifecycle |
| Innovation (20%) | On-chain retirement & certificates |
| Sustainability & Scalability (20%) | Low-cost, global XRPL infrastructure |
| Presentation (10%) | Live demo + lifecycle dashboard |

---

## 🧭 Future Roadmap

- DID integration for issuer verification  
- Integration with real carbon registries  
- Compliance-aware certificate issuance  
- Institutional and enterprise onboarding  

---

## 📬 Contact

📱 **Telegram**: `@your_telegram_handle`  
📧 **Email**: your@email.com
