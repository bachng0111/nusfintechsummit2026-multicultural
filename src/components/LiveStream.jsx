import React, { useEffect, useRef, useState } from 'react';

const XRPL_WS = 'wss://s1.ripple.com';
const MAX_EVENTS = 8;
const RIPPLE_EPOCH_OFFSET = 946684800;

const toDateString = (rippleEpochSeconds) => {
  if (!rippleEpochSeconds) return '—';
  const unixSeconds = rippleEpochSeconds + RIPPLE_EPOCH_OFFSET;
  return new Date(unixSeconds * 1000).toLocaleString();
};

const LiveStream = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [events, setEvents] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isEnabled) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setIsConnected(false);
      return undefined;
    }

    const socket = new WebSocket(XRPL_WS);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setIsConnected(true);
      socket.send(
        JSON.stringify({
          command: 'subscribe',
          streams: ['transactions_proposed'],
        })
      );
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== 'transaction') return;
        if (!payload.transaction) return;

        const transaction = payload.transaction;
        const nextEvent = {
          hash: transaction.hash,
          type: transaction.TransactionType,
          account: transaction.Account,
          date: toDateString(transaction.date),
        };

        setEvents((prev) => [nextEvent, ...prev].slice(0, MAX_EVENTS));
      } catch (error) {
        // Ignore malformed websocket messages.
      }
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
    });

    socket.addEventListener('error', () => {
      setIsConnected(false);
    });

    return () => {
      socket.close();
    };
  }, [isEnabled]);

  return (
    <section className="stream-card">
      <div className="stream-header">
        <div>
          <p className="eyebrow">Live Mainnet Stream</p>
          <h2>Latest XRPL Transactions</h2>
          <p className="subhead">Streaming proposed transactions from XRPL mainnet.</p>
        </div>
        <div className="stream-actions">
          <span className={`stream-status ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            className="button ghost"
            type="button"
            onClick={() => setIsEnabled((prev) => !prev)}
          >
            {isEnabled ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
      <div className="stream-list">
        {events.length === 0 ? (
          <p className="stream-empty">Waiting for transactions...</p>
        ) : (
          <ul>
            {events.map((event, index) => (
              <li key={`${event.hash}-${index}`}>
                <div>
                  <span className="stream-type">{event.type}</span>
                  <span className="stream-date">{event.date}</span>
                </div>
                <span className="stream-hash">{event.hash}</span>
                <span className="stream-account">{event.account}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default LiveStream;
