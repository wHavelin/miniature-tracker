import React from 'react';
import { PAINT_STATUSES } from '../api.js';
import './FilterBar.css';

export default function FilterBar({ filters, filterOptions, onFilterChange, onClearFilters }) {
  const { game_systems = [], factions = [] } = filterOptions;

  const hasActiveFilters = filters.game_system || filters.faction || filters.paint_status || filters.search;

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        <div className="filter-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, faction, system..."
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            className="search-input"
          />
          {filters.search && (
            <button
              className="search-clear"
              onClick={() => onFilterChange('search', '')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <select
          aria-label="Filter by game system"
          value={filters.game_system}
          onChange={e => onFilterChange('game_system', e.target.value)}
          className="filter-select"
        >
          <option value="">All Systems</option>
          {game_systems.map(gs => (
            <option key={gs} value={gs}>{gs}</option>
          ))}
        </select>

        <select
          aria-label="Filter by faction"
          value={filters.faction}
          onChange={e => onFilterChange('faction', e.target.value)}
          className="filter-select"
        >
          <option value="">All Factions</option>
          {factions.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <select
          aria-label="Filter by paint status"
          value={filters.paint_status}
          onChange={e => onFilterChange('paint_status', e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          {PAINT_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button className="btn-secondary btn-clear-filters" onClick={onClearFilters}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
