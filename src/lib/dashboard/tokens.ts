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
  // Load tokens from localStorage (same source as marketplace)
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
