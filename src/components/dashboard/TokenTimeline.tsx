import React from "react";
import { Event, statusOrder } from "@/lib/dashboard/tokens";

interface TokenTimelineProps {
  events: Event[];
  currentStatus: string;
}

const TokenTimeline = ({ events, currentStatus }: TokenTimelineProps) => {
  const eventMap = events.reduce((acc, event) => {
    acc[event.type] = event;
    return acc;
  }, {} as Record<string, Event>);

  return (
    <div className="dashboard-timeline">
      {statusOrder.map((status, index) => {
        const event = eventMap[status];
        const isActive = status === currentStatus;
        const isCompleted = !!event && status !== currentStatus;
        return (
          <div
            key={status}
            className={`dashboard-timeline-item ${isActive ? "active" : ""} ${
              isCompleted ? "completed" : ""
            }`}
          >
            <div className="dashboard-timeline-marker">{index + 1}</div>
            <div className="dashboard-timeline-content">
              <span className="dashboard-timeline-status">{status}</span>
              <span className="dashboard-timeline-meta">
                {event
                  ? new Date(event.timestamp).toLocaleString()
                  : "Pending"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TokenTimeline;
