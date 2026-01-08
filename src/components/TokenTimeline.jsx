import React from 'react';
import { statusOrder } from '../services/tokens';

const TokenTimeline = ({ events, currentStatus }) => {
  const eventMap = events.reduce((acc, event) => {
    acc[event.type] = event;
    return acc;
  }, {});

  return (
    <div className="timeline">
      {statusOrder.map((status, index) => {
        const event = eventMap[status];
        const isActive = status === currentStatus;
        const isCompleted = !!event && status !== currentStatus;
        return (
          <div
            key={status}
            className={`timeline-item ${isActive ? 'active' : ''} ${
              isCompleted ? 'completed' : ''
            }`}
          >
            <div className="timeline-marker">{index + 1}</div>
            <div className="timeline-content">
              <span className="timeline-status">{status}</span>
              <span className="timeline-meta">
                {event ? new Date(event.timestamp).toLocaleString() : 'Pending'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TokenTimeline;
