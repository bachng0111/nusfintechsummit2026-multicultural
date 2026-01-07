import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">XRPL Carbon Credit Dashboard</p>
        <h1>Lifecycle of Tokenized Carbon Credits</h1>
        <p className="subhead">
          Track issuance, trading, retirement, and certification events for on-chain
          carbon credits.
        </p>
      </div>
      <div className="header-meta">
        <div>
          <span className="label">Network</span>
          <span className="value">XRPL Mainnet</span>
        </div>
        <div>
          <span className="label">Data</span>
          <span className="value">Mocked for MVP</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
