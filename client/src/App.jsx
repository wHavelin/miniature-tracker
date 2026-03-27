import React, { useState, useEffect, useCallback } from 'react';
import Stats from './components/Stats.jsx';
import FilterBar from './components/FilterBar.jsx';
import MiniatureList from './components/MiniatureList.jsx';
import MiniatureForm from './components/MiniatureForm.jsx';
import { fetchMiniatures, fetchStats, fetchFilters, deleteMiniature } from './api.js';
import './App.css';

export default function App() {
  const [miniatures, setMiniatures] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ game_systems: [], factions: [] });
  const [filters, setFilters] = useState({ game_system: '', faction: '', paint_status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMiniature, setEditingMiniature] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [minis, statsData, filtersData] = await Promise.all([
        fetchMiniatures(filters),
        fetchStats(),
        fetchFilters()
      ]);
      setMiniatures(minis);
      setStats(statsData);
      setFilterOptions(filtersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ game_system: '', faction: '', paint_status: '', search: '' });
  };

  const handleAddClick = () => {
    setEditingMiniature(null);
    setShowForm(true);
  };

  const handleEditClick = (miniature) => {
    setEditingMiniature(miniature);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMiniature(null);
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setEditingMiniature(null);
    await loadData();
  };

  const handleDelete = async (id) => {
    try {
      await deleteMiniature(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">🎨</span>
            <div>
              <h1>Miniature Tracker</h1>
              <p className="header-subtitle">Track your collection progress</p>
            </div>
          </div>
          <button className="btn-primary btn-add" onClick={handleAddClick}>
            + Add Miniature
          </button>
        </div>
      </header>

      <main className="app-main">
        {stats && <Stats stats={stats} />}

        <FilterBar
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your collection...</p>
          </div>
        ) : (
          <MiniatureList
            miniatures={miniatures}
            onEdit={handleEditClick}
            onDelete={handleDelete}
          />
        )}
      </main>

      {showForm && (
        <MiniatureForm
          miniature={editingMiniature}
          filterOptions={filterOptions}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
