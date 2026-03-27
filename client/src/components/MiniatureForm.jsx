import React, { useState, useRef, useEffect } from 'react';
import { createMiniature, updateMiniature, getImageUrl, PAINT_STATUSES, STATUS_COLORS } from '../api.js';
import './MiniatureForm.css';

const DEFAULT_FORM = {
  name: '',
  game_system: '',
  faction: '',
  quantity: 1,
  paint_status: 'unassembled',
  notes: '',
};

export default function MiniatureForm({ miniature, filterOptions = {}, onSave, onClose }) {
  const { game_systems = [], factions = [] } = filterOptions;
  const isEditing = Boolean(miniature);
  const [form, setForm] = useState(() => {
    if (miniature) {
      return {
        name: miniature.name || '',
        game_system: miniature.game_system || '',
        faction: miniature.faction || '',
        quantity: miniature.quantity || 1,
        paint_status: miniature.paint_status || 'unassembled',
        notes: miniature.notes || '',
      };
    }
    return { ...DEFAULT_FORM };
  });

  // Track which fields are in "add new" mode.
  // On edit, if the existing value isn't in the options list, start in add-new mode.
  const [addingNew, setAddingNew] = useState(() => ({
    game_system: Boolean(miniature?.game_system && !game_systems.includes(miniature.game_system)),
    faction: Boolean(miniature?.faction && !factions.includes(miniature.faction)),
  }));

  const handleSelectChange = (field, value) => {
    if (value === '__new__') {
      setAddingNew(prev => ({ ...prev, [field]: true }));
      setForm(prev => ({ ...prev, [field]: '' }));
    } else {
      setAddingNew(prev => ({ ...prev, [field]: false }));
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCancelNew = (field, options) => {
    setAddingNew(prev => ({ ...prev, [field]: false }));
    setForm(prev => ({ ...prev, [field]: options[0] || '' }));
  };

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    miniature && miniature.image_path ? getImageUrl(miniature.image_path) : null
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) firstInputRef.current.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setRemoveImage(false);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      setError('Quantity must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('game_system', form.game_system);
      fd.append('faction', form.faction);
      fd.append('quantity', qty);
      fd.append('paint_status', form.paint_status);
      fd.append('notes', form.notes);

      if (imageFile) {
        fd.append('image', imageFile);
      } else if (removeImage) {
        fd.append('remove_image', 'true');
      }

      if (isEditing) {
        await updateMiniature(miniature.id, fd);
      } else {
        await createMiniature(fd);
      }
      onSave();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const statusColors = STATUS_COLORS[form.paint_status] || {};

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Miniature' : 'Add Miniature'}</h2>
          <button className="btn-icon modal-close" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        <form className="mini-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            <div className="form-field form-field-wide">
              <label htmlFor="name">Name *</label>
              <input
                ref={firstInputRef}
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Space Marine Sergeant"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="game_system">Game System</label>
              {addingNew.game_system ? (
                <div className="add-new-field">
                  <input
                    id="game_system"
                    name="game_system"
                    type="text"
                    value={form.game_system}
                    onChange={handleChange}
                    placeholder="e.g. Warhammer 40K"
                    autoFocus
                  />
                  <button type="button" className="btn-secondary btn-cancel-new" onClick={() => handleCancelNew('game_system', game_systems)}>Cancel</button>
                </div>
              ) : (
                <select
                  id="game_system"
                  value={form.game_system}
                  onChange={e => handleSelectChange('game_system', e.target.value)}
                >
                  <option value="">— None —</option>
                  {game_systems.map(gs => (
                    <option key={gs} value={gs}>{gs}</option>
                  ))}
                  <option value="__new__">+ Add new...</option>
                </select>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="faction">Faction</label>
              {addingNew.faction ? (
                <div className="add-new-field">
                  <input
                    id="faction"
                    name="faction"
                    type="text"
                    value={form.faction}
                    onChange={handleChange}
                    placeholder="e.g. Space Marines"
                    autoFocus
                  />
                  <button type="button" className="btn-secondary btn-cancel-new" onClick={() => handleCancelNew('faction', factions)}>Cancel</button>
                </div>
              ) : (
                <select
                  id="faction"
                  value={form.faction}
                  onChange={e => handleSelectChange('faction', e.target.value)}
                >
                  <option value="">— None —</option>
                  {factions.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="__new__">+ Add new...</option>
                </select>
              )}
            </div>


            <div className="form-field form-field-narrow">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                max="9999"
                value={form.quantity}
                onChange={handleChange}
              />
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="paint_status">Paint Status</label>
              <div className="status-select-wrapper">
                <select
                  id="paint_status"
                  name="paint_status"
                  value={form.paint_status}
                  onChange={handleChange}
                  style={{
                    borderColor: statusColors.bg,
                    borderWidth: '2px'
                  }}
                >
                  {PAINT_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <span
                  className="status-dot"
                  style={{ background: statusColors.bg }}
                />
              </div>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any notes about this miniature..."
                rows={3}
              />
            </div>

            <div className="form-field form-field-full">
              <label>Image</label>
              <div className="image-upload-area">
                {imagePreview ? (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <div className="image-preview-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={handleRemoveImage}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="image-dropzone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <span className="dropzone-icon">📷</span>
                    <span className="dropzone-text">Click to upload an image</span>
                    <span className="dropzone-hint">JPG, PNG, GIF, WEBP · Max 10 MB</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="file-input-hidden"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Miniature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
