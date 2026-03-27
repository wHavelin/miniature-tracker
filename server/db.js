const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'miniatures.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS miniatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    game_system TEXT,
    faction TEXT,
    quantity INTEGER DEFAULT 1,
    paint_status TEXT DEFAULT 'unassembled',
    notes TEXT,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TRIGGER IF NOT EXISTS update_miniatures_updated_at
  AFTER UPDATE ON miniatures
  BEGIN
    UPDATE miniatures SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

// Migrations for existing databases
try { db.exec(`ALTER TABLE miniatures DROP COLUMN unit_type`); } catch (_) {}
try { db.exec(`ALTER TABLE miniatures DROP COLUMN base_size`); } catch (_) {}

const VALID_STATUSES = [
  'unassembled',
  'assembled',
  'painted'
];

function getAllMiniatures(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.game_system) {
    conditions.push('LOWER(game_system) = LOWER(?)');
    params.push(filters.game_system);
  }
  if (filters.faction) {
    conditions.push('LOWER(faction) = LOWER(?)');
    params.push(filters.faction);
  }
  if (filters.paint_status) {
    conditions.push('paint_status = ?');
    params.push(filters.paint_status);
  }
  if (filters.search) {
    conditions.push('(LOWER(name) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?) OR LOWER(faction) LIKE LOWER(?) OR LOWER(game_system) LIKE LOWER(?))');
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM miniatures ${where} ORDER BY image_path IS NULL ASC, created_at DESC`;
  return db.prepare(sql).all(...params);
}

function getMiniatureById(id) {
  return db.prepare('SELECT * FROM miniatures WHERE id = ?').get(id);
}

function createMiniature(data) {
  const {
    name,
    game_system = null,
    faction = null,
    quantity = 1,
    paint_status = 'unassembled',
    notes = null,
    image_path = null
  } = data;

  if (!name || !name.trim()) {
    throw new Error('Name is required');
  }
  if (!VALID_STATUSES.includes(paint_status)) {
    throw new Error(`Invalid paint_status: ${paint_status}`);
  }

  const stmt = db.prepare(`
    INSERT INTO miniatures (name, game_system, faction, quantity, paint_status, notes, image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    name.trim(),
    game_system || null,
    faction || null,
    parseInt(quantity, 10) || 1,
    paint_status,
    notes || null,
    image_path || null
  );

  return getMiniatureById(result.lastInsertRowid);
}

function updateMiniature(id, data) {
  const existing = getMiniatureById(id);
  if (!existing) return null;

  const {
    name,
    game_system,
    faction,
    quantity,
    paint_status,
    notes,
    image_path
  } = data;

  const updatedName = (name !== undefined ? name : existing.name).trim();
  const updatedStatus = paint_status !== undefined ? paint_status : existing.paint_status;

  if (!updatedName) throw new Error('Name is required');
  if (!VALID_STATUSES.includes(updatedStatus)) throw new Error(`Invalid paint_status: ${updatedStatus}`);

  const stmt = db.prepare(`
    UPDATE miniatures
    SET name = ?,
        game_system = ?,
        faction = ?,
        quantity = ?,
        paint_status = ?,
        notes = ?,
        image_path = ?
    WHERE id = ?
  `);

  stmt.run(
    updatedName,
    game_system !== undefined ? (game_system || null) : existing.game_system,
    faction !== undefined ? (faction || null) : existing.faction,
    quantity !== undefined ? (parseInt(quantity, 10) || 1) : existing.quantity,
    updatedStatus,
    notes !== undefined ? (notes || null) : existing.notes,
    image_path !== undefined ? (image_path || null) : existing.image_path,
    id
  );

  return getMiniatureById(id);
}

function deleteMiniature(id) {
  const existing = getMiniatureById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM miniatures WHERE id = ?').run(id);
  return existing;
}

function getStats() {
  const totalResult = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM miniatures').get();
  const total = totalResult.total;

  const byStatus = db.prepare(`
    SELECT paint_status, SUM(quantity) as count
    FROM miniatures
    GROUP BY paint_status
    ORDER BY paint_status
  `).all();

  const byGameSystem = db.prepare(`
    SELECT COALESCE(game_system, 'Unknown') as game_system, SUM(quantity) as count
    FROM miniatures
    GROUP BY game_system
    ORDER BY count DESC
  `).all();

  const completeRow = byStatus.find(r => r.paint_status === 'painted');
  const completedCount = completeRow ? completeRow.count : 0;
  const paintedPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return {
    total,
    painted_percent: paintedPercent,
    by_status: byStatus,
    by_game_system: byGameSystem
  };
}

function getDistinctValues(column) {
  const allowed = ['game_system', 'faction', 'paint_status'];
  if (!allowed.includes(column)) throw new Error('Invalid column');
  return db.prepare(`SELECT DISTINCT ${column} FROM miniatures WHERE ${column} IS NOT NULL AND ${column} != '' ORDER BY ${column}`).all().map(r => r[column]);
}

module.exports = {
  getAllMiniatures,
  getMiniatureById,
  createMiniature,
  updateMiniature,
  deleteMiniature,
  getStats,
  getDistinctValues,
  UPLOADS_DIR
};
