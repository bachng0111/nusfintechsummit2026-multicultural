import React from "react";

interface SummaryCardsProps {
  summary: Record<string, number>;
}

const SummaryCards = ({ summary }: SummaryCardsProps) => {
  // Fixed summary cards
  const fixedCards = [
    { label: "Total Tokens", value: summary.TotalTokens || 0 },
    { label: "Total Credits", value: summary.TotalCredits || 0 },
    { label: "Total Value (XRP)", value: summary.TotalValue || 0 },
    { label: "Unique Issuers", value: summary.UniqueIssuers || 0 },
  ];

  // Dynamic credit type cards (exclude the fixed keys)
  const fixedKeys = ["TotalTokens", "TotalCredits", "TotalValue", "UniqueIssuers"];
  const creditTypeCards = Object.entries(summary)
    .filter(([key]) => !fixedKeys.includes(key))
    .map(([label, value]) => ({ label, value }));

  const allCards = [...fixedCards, ...creditTypeCards];

  return (
    <section className="dashboard-summary-grid">
      {allCards.map((card) => (
        <div key={card.label} className="dashboard-summary-card">
          <span className="dashboard-summary-label">{card.label}</span>
          <span className="dashboard-summary-value">{card.value}</span>
        </div>
      ))}
    </section>
  );
};

export default SummaryCards;
