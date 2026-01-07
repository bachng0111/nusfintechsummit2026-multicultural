import React from 'react';

const Filters = ({
  statuses,
  issuers,
  projects,
  vintages,
  filters,
  onChange,
  onReset,
}) => {
  return (
    <section className="filters">
      <div className="filter-group">
        <label htmlFor="search">Search</label>
        <input
          id="search"
          type="text"
          placeholder="Token ID or project"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>
      <div className="filter-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          <option value="">All</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="issuer">Issuer</label>
        <select
          id="issuer"
          value={filters.issuer}
          onChange={(event) => onChange({ issuer: event.target.value })}
        >
          <option value="">All</option>
          {issuers.map((issuer) => (
            <option key={issuer} value={issuer}>
              {issuer}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="project">Project</label>
        <select
          id="project"
          value={filters.projectId}
          onChange={(event) => onChange({ projectId: event.target.value })}
        >
          <option value="">All</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="vintage">Vintage</label>
        <select
          id="vintage"
          value={filters.vintageYear}
          onChange={(event) => onChange({ vintageYear: event.target.value })}
        >
          <option value="">All</option>
          {vintages.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-actions">
        <button className="button ghost" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </section>
  );
};

export default Filters;
