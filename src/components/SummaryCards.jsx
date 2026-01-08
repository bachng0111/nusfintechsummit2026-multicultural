import React from 'react';

const SummaryCards = ({ summary }) => {
  const cards = [
    { label: 'Issued', value: summary.Issued },
    { label: 'Listed', value: summary.Listed },
    { label: 'Purchased', value: summary.Purchased },
    { label: 'Held', value: summary.Held },
    { label: 'Retired', value: summary.Retired },
    { label: 'Certified', value: summary.OffsetCertified },
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <div key={card.label} className="summary-card">
          <span className="summary-label">{card.label}</span>
          <span className="summary-value">{card.value}</span>
        </div>
      ))}
    </section>
  );
};

export default SummaryCards;
