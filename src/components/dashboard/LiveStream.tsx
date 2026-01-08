"use client";

import React, { useEffect, useRef, useState } from "react";

const XRPL_WS = "wss://s1.ripple.com";
const MAX_EVENTS = 8;
const RIPPLE_EPOCH_OFFSET = 946684800;

interface StreamEvent {
  hash: string;
  type: string;
  account: string;
  date: string;
}

const toDateString = (rippleEpochSeconds: number | undefined) => {
  if (!rippleEpochSeconds) return "—";
  const unixSeconds = rippleEpochSeconds + RIPPLE_EPOCH_OFFSET;
  return new Date(unixSeconds * 1000).toLocaleString();
};

const LiveStream = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

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

    socket.addEventListener("open", () => {
      setIsConnected(true);
      socket.send(
        JSON.stringify({
          command: "subscribe",
          streams: ["transactions_proposed"],
        })
      );
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== "transaction") return;
        if (!payload.transaction) return;

        const transaction = payload.transaction;
        const nextEvent: StreamEvent = {
          hash: transaction.hash,
          type: transaction.TransactionType,
          account: transaction.Account,
          date: toDateString(transaction.date),
        };

        setEvents((prev) => [nextEvent, ...prev].slice(0, MAX_EVENTS));
      } catch {
        // Ignore malformed websocket messages.
      }
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("error", () => {
      setIsConnected(false);
    });

    return () => {
      socket.close();
    };
  }, [isEnabled]);

  return (
    <section className="dashboard-stream-card">
      <div className="dashboard-stream-header">
        <div>
          <p className="dashboard-eyebrow">Live Mainnet Stream</p>
          <h2>Latest XRPL Transactions</h2>
          <p className="dashboard-subhead">
            Streaming proposed transactions from XRPL mainnet.
          </p>
        </div>
        <div className="dashboard-stream-actions">
          <span
            className={`dashboard-stream-status ${
              isConnected ? "online" : "offline"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <button
            className="dashboard-button ghost"
            type="button"
            onClick={() => setIsEnabled((prev) => !prev)}
          >
            {isEnabled ? "Pause" : "Resume"}
          </button>
        </div>
      </div>
      <div className="dashboard-stream-list">
        {events.length === 0 ? (
          <p className="dashboard-stream-empty">Waiting for transactions...</p>
        ) : (
          <ul>
            {events.map((event, index) => (
              <li key={`${event.hash}-${index}`}>
                <div>
                  <span className="dashboard-stream-type">{event.type}</span>
                  <span className="dashboard-stream-date">{event.date}</span>
                </div>
                <span className="dashboard-stream-hash">{event.hash}</span>
                <span className="dashboard-stream-account">{event.account}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default LiveStream;
