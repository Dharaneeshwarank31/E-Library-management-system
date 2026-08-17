const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { protect, adminOnly } = require('../middleware/auth');

// ─── Multer PDF Storage ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// ─── Routes ───────────────────────────────────────────────────

// GET /api/books — get all books (requires login)
router.get('/', protect, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = `
      SELECT b.id, b.title, b.author, b.description, b.category,
             b.cover_color, b.created_at, u.name AS uploaded_by_name
      FROM books b
      LEFT JOIN users u ON b.uploaded_by = u.id
    `;
    const params = [];

    const conditions = [];
    if (search) {
      conditions.push('(b.title LIKE ? OR b.author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('b.category = ?');
      params.push(category);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY b.created_at DESC';

    const [books] = await db.execute(query, params);
    res.json({ success: true, count: books.length, books });
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/books/categories — get all unique categories
router.get('/categories', protect, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category');
    res.json({ success: true, categories: rows.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/books/:id/pdf — stream PDF file (requires login)
// Accepts token as query param too (for opening in new tab)
router.get('/:id/pdf', (req, res, next) => {
  // Allow token via query string for browser tab opening
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, require('../middleware/auth').protect, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT pdf_filename, title FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const filePath = path.join(__dirname, '../uploads', rows[0].pdf_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${rows[0].title}.pdf"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('PDF serve error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/books — upload a new book (admin only)
router.post('/', protect, adminOnly, upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'PDF file is required.' });
  }

  const { title, author, description, category, cover_color } = req.body;
  if (!title || !author) {
    fs.unlinkSync(req.file.path); // cleanup uploaded file
    return res.status(400).json({ success: false, message: 'Title and Author are required.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO books (title, author, description, category, pdf_filename, cover_color, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, author, description || null, category || null, req.file.filename, cover_color || '#4F46E5', req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Book uploaded successfully!',
      book: { id: result.insertId, title, author, category },
    });
  } catch (err) {
    console.error('Upload book error:', err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/books/:id — delete a book (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT pdf_filename FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    // Delete PDF file
    const filePath = path.join(__dirname, '../uploads', rows[0].pdf_filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.execute('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Book deleted successfully.' });
  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
