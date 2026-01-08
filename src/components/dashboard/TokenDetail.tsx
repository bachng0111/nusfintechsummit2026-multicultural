import React from "react";
import { Token, Event } from "@/lib/dashboard/tokens";

interface TokenDetailProps {
  token: Token | null;
  events: Event[];
}

const formatAddress = (addr: string) => {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const TokenDetail = ({ token, events }: TokenDetailProps) => {
  if (!token) {
    return (
      <section className="dashboard-detail-card empty">
        <h2>Select a token</h2>
        <p>Choose a token from the registry to view its details.</p>
      </section>
    );
  }

  const getExplorerUrl = (txHash: string) =>
    txHash ? `https://livenet.xrpl.org/transactions/${txHash}` : "";

  return (
    <section className="dashboard-detail-card">
      <div className="dashboard-detail-header">
        <div>
          <p className="dashboard-eyebrow">Token Detail</p>
          <h2>{token.metadata?.projectName || "Unnamed Project"}</h2>
          <p className="dashboard-detail-subhead">{formatAddress(token.issuanceId)}</p>
        </div>
        <span className="dashboard-status-pill dashboard-status-Issued">
          {token.metadata?.creditType || "Carbon Credit"}
        </span>
      </div>

      <div className="dashboard-detail-grid">
        <div>
          <span className="dashboard-label">Issuer Address</span>
          <span className="dashboard-value">{formatAddress(token.address)}</span>
        </div>
        <div>
          <span className="dashboard-label">Amount</span>
          <span className="dashboard-value">{token.amount} credits</span>
        </div>
        <div>
          <span className="dashboard-label">Year Issued</span>
          <span className="dashboard-value">{token.metadata?.vintage || "—"}</span>
        </div>
        <div>
          <span className="dashboard-label">Certification</span>
          <span className="dashboard-value">{token.metadata?.certification || "—"}</span>
        </div>
        <div>
          <span className="dashboard-label">Location</span>
          <span className="dashboard-value">{token.metadata?.location || "—"}</span>
        </div>
        <div>
          <span className="dashboard-label">Price per Credit</span>
          <span className="dashboard-value">{token.metadata?.pricePerCredit || "—"} XRP</span>
        </div>
        <div>
          <span className="dashboard-label">Created At</span>
          <span className="dashboard-value">
            {new Date(token.timestamp).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="dashboard-label">IPFS Hash</span>
          <span className="dashboard-value">{token.ipfsHash ? formatAddress(token.ipfsHash) : "—"}</span>
        </div>
      </div>

      <div className="dashboard-detail-description">
        <span className="dashboard-label">Description</span>
        <p className="dashboard-value">{token.metadata?.description || "No description available."}</p>
      </div>

      {token.txHash && (
        <div className="dashboard-events">
          <div className="dashboard-events-header">
            <h3>Transaction Details</h3>
          </div>
          <ul>
            <li>
              <div className="dashboard-event-title">
                <span>Token Minted</span>
                <span>{new Date(token.timestamp).toLocaleString()}</span>
              </div>
              <span className="dashboard-event-meta">
                <a
                  href={getExplorerUrl(token.txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on XRPL Explorer
                </a>
                {" · "}
                Tx hash: {formatAddress(token.txHash)}
              </span>
            </li>
          </ul>
        </div>
      )}
    </section>
  );
};

export default TokenDetail;
