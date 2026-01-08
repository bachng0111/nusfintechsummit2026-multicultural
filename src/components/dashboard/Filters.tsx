import React from "react";

interface FiltersProps {
  creditTypes: string[];
  issuers: string[];
  certifications: string[];
  vintages: string[];
  filters: {
    search: string;
    creditType: string;
    issuer: string;
    certification: string;
    vintage: string;
  };
  onChange: (partial: Partial<FiltersProps["filters"]>) => void;
  onReset: () => void;
}

const formatAddress = (addr: string) => {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const Filters = ({
  creditTypes,
  issuers,
  certifications,
  vintages,
  filters,
  onChange,
  onReset,
}: FiltersProps) => {
  return (
    <section className="dashboard-filters">
      <div className="dashboard-filter-group">
        <label htmlFor="search">Search</label>
        <input
          id="search"
          type="text"
          placeholder="Token ID or project name"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>
      <div className="dashboard-filter-group">
        <label htmlFor="creditType">Credit Type</label>
        <select
          id="creditType"
          value={filters.creditType}
          onChange={(event) => onChange({ creditType: event.target.value })}
        >
          <option value="">All</option>
          {creditTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-filter-group">
        <label htmlFor="issuer">Issuer</label>
        <select
          id="issuer"
          value={filters.issuer}
          onChange={(event) => onChange({ issuer: event.target.value })}
        >
          <option value="">All</option>
          {issuers.map((issuer) => (
            <option key={issuer} value={issuer}>
              {formatAddress(issuer)}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-filter-group">
        <label htmlFor="certification">Certification</label>
        <select
          id="certification"
          value={filters.certification}
          onChange={(event) => onChange({ certification: event.target.value })}
        >
          <option value="">All</option>
          {certifications.map((cert) => (
            <option key={cert} value={cert}>
              {cert}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-filter-group">
        <label htmlFor="vintage">Year Issued</label>
        <select
          id="vintage"
          value={filters.vintage}
          onChange={(event) => onChange({ vintage: event.target.value })}
        >
          <option value="">All</option>
          {vintages.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-filter-actions">
        <button
          className="dashboard-button ghost"
          type="button"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
    </section>
  );
};

export default Filters;
