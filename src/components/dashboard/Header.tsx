import React from "react";

const Header = () => {
  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-eyebrow">XRPL Carbon Credit Dashboard</p>
        <h1>Lifecycle of Tokenized Carbon Credits</h1>
        <p className="dashboard-subhead">
          Track issuance, trading, retirement, and certification events for
          on-chain carbon credits.
        </p>
      </div>
    </header>
  );
};

export default Header;
