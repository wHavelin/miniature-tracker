const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(db.UPLOADS_DIR));

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, db.UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `mini-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Helper to delete an image file
function deleteImageFile(imagePath) {
  if (!imagePath) return;
  const filename = path.basename(imagePath);
  const fullPath = path.join(db.UPLOADS_DIR, filename);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (e) {
      console.error('Failed to delete image:', e.message);
    }
  }
}

// GET /api/stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/miniatures
app.get('/api/miniatures', (req, res) => {
  try {
    const { game_system, faction, paint_status, search } = req.query;
    const miniatures = db.getAllMiniatures({ game_system, faction, paint_status, search });
    res.json(miniatures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/miniatures
app.post('/api/miniatures', upload.single('image'), (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image_path = req.file.filename;
    }
    const miniature = db.createMiniature(data);
    res.status(201).json(miniature);
  } catch (err) {
    console.error(err);
    if (req.file) deleteImageFile(req.file.filename);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/miniatures/:id
app.put('/api/miniatures/:id', upload.single('image'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const existing = db.getMiniatureById(id);
    if (!existing) return res.status(404).json({ error: 'Miniature not found' });

    const data = { ...req.body };
    let oldImagePath = null;

    if (req.file) {
      // New image uploaded — mark old one for deletion
      oldImagePath = existing.image_path;
      data.image_path = req.file.filename;
    } else if (req.body.remove_image === 'true') {
      // Explicitly remove image
      oldImagePath = existing.image_path;
      data.image_path = null;
    }

    const updated = db.updateMiniature(id, data);

    if (oldImagePath) deleteImageFile(oldImagePath);

    res.json(updated);
  } catch (err) {
    console.error(err);
    if (req.file) deleteImageFile(req.file.filename);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/miniatures/:id
app.delete('/api/miniatures/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const deleted = db.deleteMiniature(id);
    if (!deleted) return res.status(404).json({ error: 'Miniature not found' });

    if (deleted.image_path) deleteImageFile(deleted.image_path);

    res.json({ message: 'Deleted successfully', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/filters — return distinct values for filter dropdowns
app.get('/api/filters', (req, res) => {
  try {
    const game_systems = db.getDistinctValues('game_system');
    const factions = db.getDistinctValues('faction');
    res.json({ game_systems, factions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Error handler for multer and others
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Miniature Tracker server running on http://localhost:${PORT}`);
});
