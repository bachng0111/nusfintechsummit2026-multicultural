# 🌿 VerdeX - Issuer Portal (RWA Minter)

This component handles the **supply side** of the marketplace. It allows project owners to tokenize Real World Assets (Carbon Credits) on the XRPL.

## 🚀 Features
- **Wallet Auth:** Connects via CrossMark/GemWallet using `xrpl-connect`.
- **RWA Verification:** Uploads PDF audit reports to IPFS (Pinata).
- **On-Chain Minting:** Issues `CO2` tokens and links metadata via the `Domain` field.

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router)
- **XRPL Lib:** `xrpl.js`
- **Storage:** IPFS (via Pinata SDK)
- **Network:** XRPL Devnet (`wss://s.devnet.rippletest.net:51233`)

## 📦 Environment Variables (.env.local)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_GATEWAY_URL=your_pinata_gateway_url

## 🏃‍♂️ How to Run
1. `npm install`
2. `npm run dev`
3. Navigate to `/issuer`

## 🧠 Core Logic
1. **Upload**: Files are pinned to IPFS.
2. **Hex Encoding**: The IPFS hash is converted to HEX.
3. **AccountSet**: The Issuer account's `Domain` field is updated to point to the metadata.
4. **Payment**: Tokens are "minted" by sending them to a holding account.