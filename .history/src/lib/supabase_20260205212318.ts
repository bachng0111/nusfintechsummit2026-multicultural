import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Token type for database
export type MintedTokenDB = {
  id?: number;
  issuance_id: string;
  issuer_address: string;
  project_name: string;
  credit_type: string;
  vintage: string;
  certification: string;
  location: string;
  description: string;
  price_per_credit: string;
  amount: number;
  tx_hash: string;
  explorer_url: string;
  ipfs_hash: string;
  is_available: boolean; // false when purchased
  created_at?: string;
};

// Convert from API format to DB format
export function toDBFormat(token: {
  issuanceId: string;
  address: string;
  metadata: {
    projectName: string;
    creditType: string;
    vintage: string;
    certification: string;
    location: string;
    description: string;
    pricePerCredit: string;
  };
  amount: number;
  txHash: string;
  explorerUrl: string;
  ipfsHash: string;
}): Omit<MintedTokenDB, 'id' | 'created_at'> {
  return {
    issuance_id: token.issuanceId,
    issuer_address: token.address,
    project_name: token.metadata.projectName,
    credit_type: token.metadata.creditType,
    vintage: token.metadata.vintage,
    certification: token.metadata.certification,
    location: token.metadata.location,
    description: token.metadata.description,
    price_per_credit: token.metadata.pricePerCredit,
    amount: token.amount,
    tx_hash: token.txHash,
    explorer_url: token.explorerUrl,
    ipfs_hash: token.ipfsHash,
    is_available: true,
  };
}

// Convert from DB format to API format
export function fromDBFormat(dbToken: MintedTokenDB): {
  issuanceId: string;
  address: string;
  metadata: {
    projectName: string;
    creditType: string;
    vintage: string;
    certification: string;
    location: string;
    description: string;
    pricePerCredit: string;
  };
  amount: number;
  timestamp: string;
  txHash: string;
  explorerUrl: string;
  ipfsHash: string;
} {
  return {
    issuanceId: dbToken.issuance_id,
    address: dbToken.issuer_address,
    metadata: {
      projectName: dbToken.project_name,
      creditType: dbToken.credit_type,
      vintage: dbToken.vintage,
      certification: dbToken.certification,
      location: dbToken.location,
      description: dbToken.description,
      pricePerCredit: dbToken.price_per_credit,
    },
    amount: dbToken.amount,
    timestamp: dbToken.created_at || new Date().toISOString(),
    txHash: dbToken.tx_hash,
    explorerUrl: dbToken.explorer_url,
    ipfsHash: dbToken.ipfs_hash,
  };
}
