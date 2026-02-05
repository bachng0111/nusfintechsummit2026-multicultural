-- Supabase SQL Setup for VerdeX Carbon Credits Marketplace
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- ==================== MARKETPLACE TOKENS TABLE ====================

-- Create the marketplace_tokens table
CREATE TABLE IF NOT EXISTS marketplace_tokens (
  id BIGSERIAL PRIMARY KEY,
  issuance_id TEXT UNIQUE NOT NULL,
  issuer_address TEXT NOT NULL,
  project_name TEXT NOT NULL,
  credit_type TEXT DEFAULT 'Carbon Offset',
  vintage TEXT,
  certification TEXT,
  location TEXT DEFAULT 'Global',
  description TEXT,
  price_per_credit TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  explorer_url TEXT,
  ipfs_hash TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_marketplace_tokens_issuance_id ON marketplace_tokens(issuance_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_tokens_is_available ON marketplace_tokens(is_available);
CREATE INDEX IF NOT EXISTS idx_marketplace_tokens_issuer ON marketplace_tokens(issuer_address);

-- Enable Row Level Security (RLS)
ALTER TABLE marketplace_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- Allow anyone to read available tokens
CREATE POLICY "Anyone can view available tokens" ON marketplace_tokens
  FOR SELECT
  USING (true);

-- Allow anyone to insert new tokens (from issuer page)
CREATE POLICY "Anyone can insert tokens" ON marketplace_tokens
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update tokens (for marking as unavailable after purchase)
CREATE POLICY "Anyone can update tokens" ON marketplace_tokens
  FOR UPDATE
  USING (true);

-- ==================== RETIREMENT CERTIFICATES TABLE ====================

-- Create the retirement_certificates table
CREATE TABLE IF NOT EXISTS retirement_certificates (
  id BIGSERIAL PRIMARY KEY,
  certificate_id TEXT UNIQUE NOT NULL,
  mpt_issuance_id TEXT NOT NULL,
  currency TEXT,
  issuer_address TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  retired_at TIMESTAMPTZ NOT NULL,
  tx_hash TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_retirement_certs_certificate_id ON retirement_certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_retirement_certs_mpt_issuance_id ON retirement_certificates(mpt_issuance_id);
CREATE INDEX IF NOT EXISTS idx_retirement_certs_owner ON retirement_certificates(owner_address);

-- Enable Row Level Security (RLS)
ALTER TABLE retirement_certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
-- Allow anyone to read retirement certificates (public ledger of retirements)
CREATE POLICY "Anyone can view retirement certificates" ON retirement_certificates
  FOR SELECT
  USING (true);

-- Allow anyone to insert retirement certificates
CREATE POLICY "Anyone can insert retirement certificates" ON retirement_certificates
  FOR INSERT
  WITH CHECK (true);

-- ==================== SAMPLE DATA (Optional) ====================

-- Optional: Add some sample data for testing
-- INSERT INTO marketplace_tokens (issuance_id, issuer_address, project_name, credit_type, vintage, certification, location, description, price_per_credit, amount, tx_hash, explorer_url, ipfs_hash, is_available)
-- VALUES (
--   'SAMPLE_ISSUANCE_ID_123',
--   'rSampleIssuerAddress123',
--   'Amazon Reforestation Project',
--   'Carbon Offset',
--   '2026',
--   'VCS',
--   'Brazil',
--   'Carbon credit token for Amazon Reforestation. Verified by Verra.',
--   '10',
--   1000,
--   'SAMPLE_TX_HASH',
--   'https://devnet.xrpl.org/mpt/SAMPLE_ISSUANCE_ID_123',
--   'QmSampleIPFSHash',
--   true
-- );
