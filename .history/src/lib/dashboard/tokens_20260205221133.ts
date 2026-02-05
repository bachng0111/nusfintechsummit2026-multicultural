import eventsData from "./events.json";

// Token type matching the issuer's minted token structure from marketplace
export interface Token {
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
  status?: 'Listed' | 'Purchased' | 'Retired'; // Token lifecycle status
}

export interface Event {
  id: string;
  tokenId: string;
  type: string;
  timestamp: string;
  actor: string;
  details: string;
  txHash?: string;
}

export const statusOrder = [
  "Issued",
  "Listed",
  "Purchased",
  "Held",
  "Retired",
  "OffsetCertified",
];

export const getTokens = async (): Promise<Token[]> => {
  // Fetch all tokens from Supabase (both available and purchased)
  try {
    // Fetch all tokens from archive API (includes all tokens)
    const tokensRes = await fetch('/api/tokens/archive', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!tokensRes.ok) {
      throw new Error('Failed to fetch tokens from API');
    }

    const tokensData = await tokensRes.json();
    const allTokens: Token[] = tokensData.tokens || [];

    // Fetch retirement certificates to determine retired status
    const retirementsRes = await fetch('/api/retirements', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    let retirements: any[] = [];
    let retiredTokenIds = new Set<string>();
    if (retirementsRes.ok) {
      const retirementsData = await retirementsRes.json();
      retirements = retirementsData.retirements || [];
      retiredTokenIds = new Set(retirements.map((r: any) => r.mptIssuanceId));
    }

    // Fetch available tokens to determine listing status
    const availableRes = await fetch('/api/tokens', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    let availableTokenIds = new Set<string>();
    if (availableRes.ok) {
      const availableData = await availableRes.json();
      const availableTokens = availableData.tokens || [];
      availableTokenIds = new Set(availableTokens.map((t: any) => t.issuanceId));
    }

    // Create a map of existing tokens by issuanceId
    const tokenMap = new Map<string, Token>();
    
    // Add all tokens from archive with status
    allTokens.forEach((token: Token) => {
      let status: 'Listed' | 'Purchased' | 'Retired' = 'Listed';
      
      if (retiredTokenIds.has(token.issuanceId)) {
        status = 'Retired';
      } else if (!availableTokenIds.has(token.issuanceId)) {
        status = 'Purchased';
      }

      tokenMap.set(token.issuanceId, { ...token, status });
    });

    // Add retired tokens that aren't in the archive (for tokens retired before Supabase migration)
    retirements.forEach((retirement: any) => {
      if (!tokenMap.has(retirement.mptIssuanceId)) {
        // Create a token entry from retirement certificate data
        const retiredToken: Token = {
          issuanceId: retirement.mptIssuanceId,
          address: retirement.issuer || '',
          metadata: {
            projectName: `Retired Credit`,
            creditType: retirement.currency || 'CARBON',
            vintage: '',
            certification: '',
            location: '',
            description: `Retired on ${new Date(retirement.retiredAt).toLocaleDateString()}`,
            pricePerCredit: '',
          },
          amount: parseFloat(retirement.amount) || 0,
          timestamp: retirement.retiredAt,
          txHash: retirement.txHash || '',
          explorerUrl: `https://devnet.xrpl.org/transactions/${retirement.txHash}`,
          ipfsHash: '',
          status: 'Retired',
        };
        tokenMap.set(retirement.mptIssuanceId, retiredToken);
      }
    });

    return Array.from(tokenMap.values());
  } catch (error) {
    console.error('Failed to fetch tokens from Supabase:', error);
    
    // Fallback to localStorage if API fails
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mintedTokens");
      if (stored) {
        try {
          return JSON.parse(stored) as Token[];
        } catch {
          console.error("Failed to parse stored tokens");
        }
      }
    }
    return [];
  }
};

export const getEvents = async (): Promise<Event[]> => {
  return eventsData as Event[];
};

export const getEventsByToken = (tokenId: string, events: Event[]): Event[] => {
  return events
    .filter((event) => event.tokenId === tokenId)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
};

export const getSummaryCounts = (
  tokenList: Token[]
): Record<string, number> => {
  // Count by credit type for marketplace tokens
  const creditTypeCounts: Record<string, number> = {};
  let totalCredits = 0;
  let totalValue = 0;

  tokenList.forEach((token) => {
    const creditType = token.metadata?.creditType || "Unknown";
    creditTypeCounts[creditType] = (creditTypeCounts[creditType] || 0) + 1;
    totalCredits += token.amount || 0;
    totalValue += (token.amount || 0) * parseFloat(token.metadata?.pricePerCredit || "0");
  });

  return {
    TotalTokens: tokenList.length,
    TotalCredits: totalCredits,
    TotalValue: Math.round(totalValue * 100) / 100,
    UniqueIssuers: new Set(tokenList.map(t => t.address)).size,
    ...creditTypeCounts,
  };
};

export const getStatusIndex = (status: string): number => {
  const idx = statusOrder.indexOf(status);
  return idx === -1 ? 0 : idx;
};
