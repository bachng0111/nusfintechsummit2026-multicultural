"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/dashboard/Header";
import SummaryCards from "@/components/dashboard/SummaryCards";
import Filters from "@/components/dashboard/Filters";
import TokenTable from "@/components/dashboard/TokenTable";
import TokenDetail from "@/components/dashboard/TokenDetail";
import LiveStream from "@/components/dashboard/LiveStream";
import {
  getEvents,
  getEventsByToken,
  getSummaryCounts,
  getTokens,
  statusOrder,
  Token,
  Event,
} from "@/lib/dashboard/tokens";
import "./dashboard.css";

const initialFilters = {
  search: "",
  creditType: "",
  issuer: "",
  certification: "",
  vintage: "",
};

export default function DashboardPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Token | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const load = async () => {
      const tokenData = await getTokens();
      const eventData = await getEvents();
      setTokens(tokenData);
      setAllEvents(eventData);
      setSelected(tokenData[0] || null);
    };

    load();
  }, []);

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesSearch =
        filters.search.trim() === "" ||
        token.issuanceId.toLowerCase().includes(filters.search.toLowerCase()) ||
        (token.metadata?.projectName || "").toLowerCase().includes(filters.search.toLowerCase());

      const matchesCreditType = !filters.creditType || token.metadata?.creditType === filters.creditType;
      const matchesIssuer = !filters.issuer || token.address === filters.issuer;
      const matchesCertification =
        !filters.certification || token.metadata?.certification === filters.certification;
      const matchesVintage =
        !filters.vintage || token.metadata?.vintage === filters.vintage;

      return (
        matchesSearch &&
        matchesCreditType &&
        matchesIssuer &&
        matchesCertification &&
        matchesVintage
      );
    });
  }, [tokens, filters]);

  // Auto-select the first filtered token when filters change
  useEffect(() => {
    if (filteredTokens.length > 0) {
      setSelected(filteredTokens[0]);
    } else {
      setSelected(null);
    }
  }, [filteredTokens]);

  const summary = useMemo(() => getSummaryCounts(tokens), [tokens]);

  const issuers = useMemo(
    () => Array.from(new Set(tokens.map((token) => token.address))),
    [tokens]
  );

  const creditTypes = useMemo(
    () => Array.from(new Set(tokens.map((token) => token.metadata?.creditType).filter(Boolean))),
    [tokens]
  );

  const certifications = useMemo(
    () => Array.from(new Set(tokens.map((token) => token.metadata?.certification).filter(Boolean))),
    [tokens]
  );

  const vintages = useMemo(
    () =>
      Array.from(new Set(tokens.map((token) => token.metadata?.vintage).filter(Boolean))).sort(),
    [tokens]
  );

  const selectedEvents = useMemo(() => {
    if (!selected) return [];
    return getEventsByToken(selected.issuanceId, allEvents);
  }, [selected, allEvents]);

  const handleFilterChange = (partial: Partial<typeof initialFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="dashboard-app">
      <Header />
      <SummaryCards summary={summary} />
      <LiveStream />
      <Filters
        creditTypes={creditTypes as string[]}
        issuers={issuers}
        certifications={certifications as string[]}
        vintages={vintages as string[]}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />
      <div className="dashboard-layout">
        <TokenTable
          tokens={filteredTokens}
          selectedId={selected?.issuanceId}
          onSelect={setSelected}
        />
        <TokenDetail token={selected} events={selectedEvents} />
      </div>
      <footer className="dashboard-footer">
        Built for XRPL carbon credit lifecycle transparency.
      </footer>
    </div>
  );
}
