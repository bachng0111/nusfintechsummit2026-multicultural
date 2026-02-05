import React from "react";
import { Token } from "@/lib/dashboard/tokens";

interface TokenTableProps {
  tokens: Token[];
  selectedId?: string;
  onSelect: (token: Token) => void;
}

const formatAddress = (addr: string) => {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'Listed':
      return 'dashboard-status-Listed';
    case 'Purchased':
      return 'dashboard-status-Purchased';
    case 'Retired':
      return 'dashboard-status-Retired';
    default:
      return 'dashboard-status-Issued';
  }
};

const TokenTable = ({ tokens, selectedId, onSelect }: TokenTableProps) => {
  return (
    <section className="dashboard-table-card">
      <div className="dashboard-table-header">
        <h2>Token Registry</h2>
        <span>{tokens.length} credits</span>
      </div>
      <div className="dashboard-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Token ID</th>
              <th>Project Name</th>
              <th>Credit Type</th>
              <th>Status</th>
              <th>Year Issued</th>
              <th>Certification</th>
              <th>Location</th>
              <th>Amount</th>
              <th>Price/Credit</th>
              <th>Issuer</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr
                key={token.issuanceId}
                className={token.issuanceId === selectedId ? "active" : ""}
                onClick={() => onSelect(token)}
              >
                <td>{formatAddress(token.issuanceId)}</td>
                <td>{token.metadata?.projectName || "—"}</td>
                <td>
                  <span className="dashboard-status-pill dashboard-status-Issued">
                    {token.metadata?.creditType || "—"}
                  </span>
                </td>
                <td>
                  <span className={`dashboard-status-pill ${getStatusColor(token.status)}`}>
                    {token.status || "Listed"}
                  </span>
                </td>
                <td>{token.metadata?.vintage || "—"}</td>
                <td>{token.metadata?.certification || "—"}</td>
                <td>{token.metadata?.location || "—"}</td>
                <td>{token.amount}</td>
                <td>{token.metadata?.pricePerCredit || "—"} XRP</td>
                <td>{formatAddress(token.address)}</td>
                <td>{new Date(token.timestamp).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TokenTable;
