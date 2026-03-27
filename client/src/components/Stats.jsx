import React from 'react';
import { STATUS_COLORS, getStatusLabel, PAINT_STATUSES } from '../api.js';
import './Stats.css';

export default function Stats({ stats }) {
  if (!stats) return null;

  const { total, painted_percent, by_status, by_game_system } = stats;

  const statusMap = {};
  if (by_status) {
    by_status.forEach(row => {
      statusMap[row.paint_status] = row.count;
    });
  }

  return (
    <div className="stats-container">
      <div className="stats-summary">
        <div className="stat-card stat-total">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Miniatures</div>
        </div>
        <div className="stat-card stat-painted">
          <div className="stat-value">{painted_percent}%</div>
          <div className="stat-label">Fully Painted</div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill"
              style={{ width: `${painted_percent}%` }}
            />
          </div>
        </div>
        {by_game_system && by_game_system.length > 0 && (
          <div className="stat-card stat-systems">
            <div className="stat-label" style={{ marginBottom: '0.5rem' }}>By Game System</div>
            <div className="system-list">
              {by_game_system.slice(0, 4).map(row => (
                <div key={row.game_system} className="system-row">
                  <span className="system-name">{row.game_system}</span>
                  <span className="system-count">{row.count}</span>
                </div>
              ))}
              {by_game_system.length > 4 && (
                <div className="system-row system-more">
                  <span className="system-name">+{by_game_system.length - 4} more</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="stats-status-breakdown">
        {PAINT_STATUSES.map(({ value, label }) => {
          const count = statusMap[value] || 0;
          const colors = STATUS_COLORS[value];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={value}
              className="status-badge"
              style={{ '--badge-bg': colors.bg, '--badge-text': colors.text }}
            >
              <span className="badge-label">{label}</span>
              <span className="badge-count">{count}</span>
              {total > 0 && <span className="badge-pct">{pct}%</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
