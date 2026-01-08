import React from 'react';

const TokenTable = ({ tokens, selectedId, onSelect }) => {
  return (
    <section className="table-card">
      <div className="table-header">
        <h2>Token Registry</h2>
        <span>{tokens.length} credits</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Token ID</th>
              <th>Project</th>
              <th>Vintage</th>
              <th>Status</th>
              <th>Issuer</th>
              <th>Owner</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr
                key={token.id}
                className={token.id === selectedId ? 'active' : ''}
                onClick={() => onSelect(token)}
              >
                <td>{token.id}</td>
                <td>{token.projectId}</td>
                <td>{token.vintageYear}</td>
                <td>
                  <span className={`status-pill status-${token.status}`}>
                    {token.status}
                  </span>
                </td>
                <td>{token.issuer}</td>
                <td>{token.currentOwner}</td>
                <td>{new Date(token.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TokenTable;
