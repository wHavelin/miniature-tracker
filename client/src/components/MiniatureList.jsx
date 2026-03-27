import React from 'react';
import MiniatureCard from './MiniatureCard.jsx';
import './MiniatureList.css';

export default function MiniatureList({ miniatures, onEdit, onDelete }) {
  if (miniatures.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🗡️</div>
        <h3>No miniatures found</h3>
        <p>Add your first miniature or adjust your filters to see results.</p>
      </div>
    );
  }

  return (
    <div className="miniature-list">
      <div className="list-header">
        <span className="list-count">{miniatures.length} {miniatures.length === 1 ? 'miniature' : 'miniatures'}</span>
      </div>
      <div className="miniature-grid">
        {miniatures.map(mini => (
          <MiniatureCard
            key={mini.id}
            miniature={mini}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
