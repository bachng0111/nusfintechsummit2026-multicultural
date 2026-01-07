import React from 'react';
import TokenTimeline from './TokenTimeline.jsx';

const TokenDetail = ({ token, events }) => {
  if (!token) {
    return (
      <section className="detail-card empty">
        <h2>Select a token</h2>
        <p>Choose a token from the registry to view its lifecycle events.</p>
      </section>
    );
  }

  const certification = events.find((event) => event.type === 'OffsetCertified');
  const retirement = events.find((event) => event.type === 'Retired');

  return (
    <section className="detail-card">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Token Detail</p>
          <h2>{token.id}</h2>
          <p className="detail-subhead">{token.projectId}</p>
        </div>
        <span className={`status-pill status-${token.status}`}>{token.status}</span>
      </div>

      <TokenTimeline events={events} currentStatus={token.status} />

      <div className="detail-grid">
        <div>
          <span className="label">Issuer</span>
          <span className="value">{token.issuer}</span>
        </div>
        <div>
          <span className="label">Current Owner</span>
          <span className="value">{token.currentOwner}</span>
        </div>
        <div>
          <span className="label">Vintage Year</span>
          <span className="value">{token.vintageYear}</span>
        </div>
        <div>
          <span className="label">Metadata</span>
          <span className="value">{token.metadataUrl}</span>
        </div>
        <div>
          <span className="label">Retired At</span>
          <span className="value">
            {retirement ? new Date(retirement.timestamp).toLocaleString() : '—'}
          </span>
        </div>
        <div>
          <span className="label">Certificate</span>
          <span className="value">
            {certification ? certification.details : 'Pending'}
          </span>
        </div>
      </div>

      <div className="events">
        <div className="events-header">
          <h3>Event History</h3>
          <span>{events.length} events</span>
        </div>
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <div className="event-title">
                <span>{event.type}</span>
                <span>{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              <p>{event.details}</p>
              <span className="event-meta">Actor: {event.actor}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default TokenDetail;
