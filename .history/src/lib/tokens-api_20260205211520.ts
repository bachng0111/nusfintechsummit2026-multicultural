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
