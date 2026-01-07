import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import Filters from './components/Filters.jsx';
import TokenTable from './components/TokenTable.jsx';
import TokenDetail from './components/TokenDetail.jsx';
import LiveStream from './components/LiveStream.jsx';
import {
  getEvents,
  getEventsByToken,
  getSummaryCounts,
  getTokens,
  statusOrder,
} from './services/tokens.js';

const initialFilters = {
  search: '',
  status: '',
  issuer: '',
  projectId: '',
  vintageYear: '',
};

const App = () => {
  const [tokens, setTokens] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [selected, setSelected] = useState(null);
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
        filters.search.trim() === '' ||
        token.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        token.projectId.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = !filters.status || token.status === filters.status;
      const matchesIssuer = !filters.issuer || token.issuer === filters.issuer;
      const matchesProject = !filters.projectId || token.projectId === filters.projectId;
      const matchesVintage =
        !filters.vintageYear || String(token.vintageYear) === filters.vintageYear;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesIssuer &&
        matchesProject &&
        matchesVintage
      );
    });
  }, [tokens, filters]);

  const summary = useMemo(() => getSummaryCounts(tokens), [tokens]);

  const issuers = useMemo(
    () => Array.from(new Set(tokens.map((token) => token.issuer))),
    [tokens]
  );

  const projects = useMemo(
    () => Array.from(new Set(tokens.map((token) => token.projectId))),
    [tokens]
  );

  const vintages = useMemo(
    () => Array.from(new Set(tokens.map((token) => token.vintageYear))).sort(),
    [tokens]
  );

  const selectedEvents = useMemo(() => {
    if (!selected) return [];
    return getEventsByToken(selected.id);
  }, [selected, allEvents]);

  const handleFilterChange = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="app">
      <Header />
      <SummaryCards summary={summary} />
      <Filters
        statuses={statusOrder}
        issuers={issuers}
        projects={projects}
        vintages={vintages}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />
      <LiveStream />
      <div className="layout">
        <TokenTable
          tokens={filteredTokens}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
        <TokenDetail token={selected} events={selectedEvents} />
      </div>
      <footer className="footer">
        Built for XRPL carbon credit lifecycle transparency.
      </footer>
    </div>
  );
};

export default App;
