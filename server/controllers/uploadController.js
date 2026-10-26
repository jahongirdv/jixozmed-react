const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Папка для загрузок
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Хранилище — куда и как сохранять
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

// Multer
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 МБ
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif/i.test(file.mimetype);
    cb(ok ? null : new Error('Только изображения (jpeg/png/webp/gif)'), ok);
  },
});

// POST /api/upload/photo
async function uploadPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }
    const url = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      url,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (err) {
    console.error('❌ /upload/photo:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/upload/photo/:filename
async function deletePhoto(req, res) {
  try {
    const { filename } = req.params;
    const safe = path.basename(filename); // защита от ../../
    const fullPath = path.join(UPLOAD_DIR, safe);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ success: false, error: 'Недопустимый путь' });
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return res.json({ success: true, deleted: safe });
  } catch (err) {
    console.error('❌ /upload/photo delete:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { upload, uploadPhoto, deletePhoto };
