// API client for token storage operations

export type MintedToken = {
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
};

const API_BASE = '/api/tokens';

/**
 * Fetch all available marketplace tokens
 */
export async function fetchMarketplaceTokens(): Promise<MintedToken[]> {
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tokens || [];
  } catch (error) {
    console.error('Error fetching marketplace tokens:', error);
    return [];
  }
}

/**
 * Save a new token to the marketplace
 */
export async function saveMarketplaceToken(token: MintedToken): Promise<boolean> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save token');
    }

    return true;
  } catch (error) {
    console.error('Error saving marketplace token:', error);
    return false;
  }
}

/**
 * Remove a token from the marketplace (after purchase)
 */
export async function removeMarketplaceToken(issuanceId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}?issuanceId=${encodeURIComponent(issuanceId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove token');
    }

    return true;
  } catch (error) {
    console.error('Error removing marketplace token:', error);
    return false;
  }
}

/**
 * Fetch a token from the archive by issuance ID (for metadata lookup)
 */
export async function fetchArchivedToken(issuanceId: string): Promise<MintedToken | null> {
  try {
    const response = await fetch(`${API_BASE}/archive?issuanceId=${encodeURIComponent(issuanceId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error fetching archived token:', error);
    return null;
  }
}

/**
 * Fetch all archived tokens
 */
export async function fetchAllArchivedTokens(): Promise<MintedToken[]> {
  try {
    const response = await fetch(`${API_BASE}/archive`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch archive: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tokens || [];
  } catch (error) {
    console.error('Error fetching archived tokens:', error);
    return [];
  }
}

// ==================== RETIREMENT CERTIFICATES ====================

export type RetirementCertificate = {
  certificateId: string;
  mptIssuanceId: string;
  currency: string;
  issuer: string;
  ownerAddress: string;
  amount: string;
  retiredAt: string;
  txHash: string;
  reason?: string;
};

const RETIREMENTS_API = '/api/retirements';

/**
 * Save a retirement certificate to the database
 */
export async function saveRetirementCertificate(cert: RetirementCertificate): Promise<boolean> {
  try {
    const response = await fetch(RETIREMENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cert),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save retirement certificate');
    }

    return true;
  } catch (error) {
    console.error('Error saving retirement certificate:', error);
    return false;
  }
}

/**
 * Fetch retirement certificates for a specific owner
 */
export async function fetchRetirementsByOwner(ownerAddress: string): Promise<RetirementCertificate[]> {
  try {
    const response = await fetch(`${RETIREMENTS_API}?ownerAddress=${encodeURIComponent(ownerAddress)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch retirements: ${response.statusText}`);
    }

    const data = await response.json();
    return data.certificates || [];
  } catch (error) {
    console.error('Error fetching retirement certificates:', error);
    return [];
  }
}

/**
 * Fetch all retirement certificates
 */
export async function fetchAllRetirements(): Promise<RetirementCertificate[]> {
  try {
    const response = await fetch(RETIREMENTS_API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch retirements: ${response.statusText}`);
    }

    const data = await response.json();
    return data.certificates || [];
  } catch (error) {
    console.error('Error fetching retirement certificates:', error);
    return [];
  }
}

/**
 * Check if a token has been retired
 */
export async function isTokenRetired(mptIssuanceId: string): Promise<boolean> {
  try {
    const response = await fetch(`${RETIREMENTS_API}?mptIssuanceId=${encodeURIComponent(mptIssuanceId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return (data.certificates || []).length > 0;
  } catch (error) {
    console.error('Error checking token retirement:', error);
    return false;
  }
}
