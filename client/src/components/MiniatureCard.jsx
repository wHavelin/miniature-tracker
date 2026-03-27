import React, { useState } from 'react';
import { STATUS_COLORS, getStatusLabel, getImageUrl } from '../api.js';
import './MiniatureCard.css';

export default function MiniatureCard({ miniature, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    id,
    name,
    game_system,
    faction,
    quantity,
    paint_status,
    notes,
    image_path
  } = miniature;

  const statusColors = STATUS_COLORS[paint_status] || { bg: '#555', text: '#fff' };
  const imageUrl = !imgError && image_path ? getImageUrl(image_path) : null;

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(id);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };

  return (
    <div className="mini-card">
      {imageUrl ? (
        <div className="mini-card-image">
          <img
            src={imageUrl}
            alt={name}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="mini-card-image mini-card-image-placeholder">
          <span className="placeholder-icon">⚔️</span>
        </div>
      )}

      <div className="mini-card-body">
        <div className="mini-card-header">
          <h3 className="mini-name" title={name}>{name}</h3>
          <span
            className="mini-status-badge"
            style={{ '--badge-bg': statusColors.bg, '--badge-text': statusColors.text }}
          >
            {getStatusLabel(paint_status)}
          </span>
        </div>

        <div className="mini-meta">
          {game_system && (
            <div className="meta-row">
              <span className="meta-icon">🎲</span>
              <span className="meta-value">{game_system}</span>
            </div>
          )}
          {faction && (
            <div className="meta-row">
              <span className="meta-icon">🛡️</span>
              <span className="meta-value">{faction}</span>
            </div>
          )}
          <div className="meta-row">
            <span className="meta-icon">🔢</span>
            <span className="meta-value">
              {quantity} {quantity === 1 ? 'model' : 'models'}
            </span>
          </div>
        </div>

        {notes && (
          <p className="mini-notes" title={notes}>{notes}</p>
        )}

        <div className="mini-card-actions">
          {confirmDelete ? (
            <div className="delete-confirm">
              <span className="confirm-text">Delete?</span>
              <button className="btn-danger" onClick={handleDeleteClick}>Yes</button>
              <button className="btn-secondary" onClick={handleCancelDelete}>No</button>
            </div>
          ) : (
            <>
              <button className="btn-secondary btn-edit" onClick={() => onEdit(miniature)}>
                ✏️ Edit
              </button>
              <button className="btn-danger btn-delete" onClick={handleDeleteClick}>
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
