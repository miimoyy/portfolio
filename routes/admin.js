const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const sanitizeHtml = require('sanitize-html');
const authMiddleware = require('../middleware/auth');
const { getClient } = require('../database/db');
const cloudinary = require('../config/cloudinary');

// Sanitize helper
function sanitize(str) {
  if (!str) return '';
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });
}

// ─── Cloudinary Storage: Certificate PDF ───────────────────────────────────
const certStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'portfolio/certificates',
    resource_type: 'raw',   // PDF bukan image
    allowed_formats: ['pdf'],
  },
});

const uploadCert = multer({
  storage: certStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Hanya file PDF yang diizinkan.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── Cloudinary Storage: Profile Photo ─────────────────────────────────────
const photoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'portfolio/profile',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

const uploadProfile = multer({
  storage: photoStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya JPG, PNG, dan WebP yang diizinkan.'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ============================================================
// LOGIN
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password diperlukan.' });

    const client = getClient();
    const result = await client.execute(`SELECT value FROM settings WHERE key = 'admin_password_hash'`);
    if (result.rows.length === 0) return res.status(500).json({ error: 'Admin password belum dikonfigurasi.' });

    const isValid = bcrypt.compareSync(password, result.rows[0].value);
    if (!isValid) return res.status(401).json({ error: 'Password salah.' });

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, expiresIn: 7200 });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// PROFILE MANAGEMENT
// ============================================================

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const client = getClient();
    const result = await client.execute('SELECT * FROM profile WHERE id = 1');
    const profile = { ...result.rows[0] };
    try { profile.skills = JSON.parse(profile.skills || '[]'); } catch { profile.skills = []; }
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const client = getClient();
    const { full_name, tagline, skills, stat_years, stat_platforms, about, linkedin, github, instagram, email } = req.body;

    let skillsJson = '[]';
    if (Array.isArray(skills)) {
      skillsJson = JSON.stringify(skills.map(s => sanitize(String(s))).filter(Boolean));
    }

    await client.execute({
      sql: `UPDATE profile SET
              full_name=?, tagline=?, skills=?,
              stat_years=?, stat_platforms=?,
              about=?, linkedin=?, github=?, instagram=?, email=?
            WHERE id = 1`,
      args: [
        sanitize(full_name), sanitize(tagline), skillsJson,
        sanitize(stat_years), sanitize(stat_platforms),
        sanitize(about), sanitize(linkedin), sanitize(github), sanitize(instagram), sanitize(email),
      ],
    });

    const updated = await client.execute('SELECT * FROM profile WHERE id = 1');
    const profile = { ...updated.rows[0] };
    try { profile.skills = JSON.parse(profile.skills || '[]'); } catch { profile.skills = []; }
    res.json({ message: 'Profil berhasil diperbarui.', profile });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile photo → Cloudinary
router.post('/profile/photo', authMiddleware, uploadProfile.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File foto tidak ditemukan.' });

    // Cloudinary returns the secure URL in req.file.path
    const photoUrl = req.file.path;
    const client = getClient();
    await client.execute({ sql: 'UPDATE profile SET photo = ? WHERE id = 1', args: [photoUrl] });

    res.json({ message: 'Foto profil berhasil diupload.', photo: photoUrl });
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// EDUCATION MANAGEMENT
// ============================================================

router.get('/education', authMiddleware, async (req, res) => {
  try {
    const client = getClient();
    const result = await client.execute('SELECT * FROM education ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching education:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/education', authMiddleware, async (req, res) => {
  try {
    const { level, institution, major, year_start, year_end } = req.body;
    if (!institution?.trim()) return res.status(400).json({ error: 'Nama institusi wajib diisi.' });

    const client = getClient();
    const maxRes = await client.execute('SELECT MAX(sort_order) as max_order FROM education');
    const nextOrder = (Number(maxRes.rows[0].max_order) || 0) + 1;

    const result = await client.execute({
      sql: `INSERT INTO education (level, institution, major, year_start, year_end, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [sanitize(level), sanitize(institution), sanitize(major), sanitize(year_start), sanitize(year_end), nextOrder],
    });

    const inserted = await client.execute({ sql: 'SELECT * FROM education WHERE id = ?', args: [Number(result.lastInsertRowid)] });
    res.status(201).json({ message: 'Pendidikan berhasil ditambahkan.', education: inserted.rows[0] });
  } catch (err) {
    console.error('Error adding education:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/education/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { level, institution, major, year_start, year_end } = req.body;
    if (!institution?.trim()) return res.status(400).json({ error: 'Nama institusi wajib diisi.' });

    const client = getClient();
    const check = await client.execute({ sql: 'SELECT id FROM education WHERE id = ?', args: [id] });
    if (check.rows.length === 0) return res.status(404).json({ error: 'Data pendidikan tidak ditemukan.' });

    await client.execute({
      sql: `UPDATE education SET level=?, institution=?, major=?, year_start=?, year_end=? WHERE id=?`,
      args: [sanitize(level), sanitize(institution), sanitize(major), sanitize(year_start), sanitize(year_end), id],
    });

    const updated = await client.execute({ sql: 'SELECT * FROM education WHERE id = ?', args: [id] });
    res.json({ message: 'Pendidikan berhasil diperbarui.', education: updated.rows[0] });
  } catch (err) {
    console.error('Error updating education:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/education/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const client = getClient();
    const check = await client.execute({ sql: 'SELECT id FROM education WHERE id = ?', args: [id] });
    if (check.rows.length === 0) return res.status(404).json({ error: 'Data pendidikan tidak ditemukan.' });

    await client.execute({ sql: 'DELETE FROM education WHERE id = ?', args: [id] });
    res.json({ message: 'Pendidikan berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting education:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/education-reorder', authMiddleware, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Data order tidak valid.' });

    const client = getClient();
    await client.batch(
      order.map(item => ({
        sql: 'UPDATE education SET sort_order = ? WHERE id = ?',
        args: [item.sort_order, item.id],
      })),
      'write'
    );
    res.json({ message: 'Urutan pendidikan berhasil diperbarui.' });
  } catch (err) {
    console.error('Error reordering education:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// CERTIFICATE MANAGEMENT
// ============================================================

router.get('/certificates', authMiddleware, async (req, res) => {
  try {
    const client = getClient();
    const result = await client.execute('SELECT * FROM certificates ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/certificates', authMiddleware, async (req, res) => {
  try {
    const { title, issuer, issued_date } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Judul sertifikat wajib diisi.' });

    const client = getClient();
    const maxRes = await client.execute('SELECT MAX(sort_order) as max_order FROM certificates');
    const nextOrder = (Number(maxRes.rows[0].max_order) || 0) + 1;

    const result = await client.execute({
      sql: `INSERT INTO certificates (title, issuer, issued_date, file_path, sort_order)
            VALUES (?, ?, ?, '', ?)`,
      args: [sanitize(title), sanitize(issuer), sanitize(issued_date || ''), nextOrder],
    });

    const inserted = await client.execute({ sql: 'SELECT * FROM certificates WHERE id = ?', args: [Number(result.lastInsertRowid)] });
    res.status(201).json({ message: 'Sertifikat berhasil ditambahkan.', certificate: inserted.rows[0] });
  } catch (err) {
    console.error('Error adding certificate:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/certificates/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, issuer, issued_date } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Judul sertifikat wajib diisi.' });

    const client = getClient();
    const check = await client.execute({ sql: 'SELECT id FROM certificates WHERE id = ?', args: [id] });
    if (check.rows.length === 0) return res.status(404).json({ error: 'Sertifikat tidak ditemukan.' });

    await client.execute({
      sql: `UPDATE certificates SET title=?, issuer=?, issued_date=? WHERE id=?`,
      args: [sanitize(title), sanitize(issuer), sanitize(issued_date || ''), id],
    });

    const updated = await client.execute({ sql: 'SELECT * FROM certificates WHERE id = ?', args: [id] });
    res.json({ message: 'Sertifikat berhasil diperbarui.', certificate: updated.rows[0] });
  } catch (err) {
    console.error('Error updating certificate:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/certificates/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const client = getClient();
    const check = await client.execute({ sql: 'SELECT * FROM certificates WHERE id = ?', args: [id] });
    if (check.rows.length === 0) return res.status(404).json({ error: 'Sertifikat tidak ditemukan.' });

    const cert = check.rows[0];
    // Delete from Cloudinary if file exists
    if (cert.file_path) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = cert.file_path.split('/');
        const folderAndFile = urlParts.slice(-3).join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(folderAndFile, { resource_type: 'raw' });
      } catch (e) {
        console.warn('Could not delete from Cloudinary:', e.message);
      }
    }

    await client.execute({ sql: 'DELETE FROM certificates WHERE id = ?', args: [id] });
    res.json({ message: 'Sertifikat berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting certificate:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload PDF → Cloudinary
router.post('/certificates/:id/upload', authMiddleware, uploadCert.single('certificate'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File PDF tidak ditemukan.' });

    const { id } = req.params;
    const client = getClient();

    const check = await client.execute({ sql: 'SELECT * FROM certificates WHERE id = ?', args: [id] });
    if (check.rows.length === 0) {
      // cleanup orphan upload
      try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }); } catch {}
      return res.status(404).json({ error: 'Sertifikat tidak ditemukan.' });
    }

    // Cloudinary secure URL
    const fileUrl = req.file.path;

    await client.execute({
      sql: 'UPDATE certificates SET file_path = ? WHERE id = ?',
      args: [fileUrl, id],
    });

    res.json({ message: 'File PDF sertifikat berhasil diupload.', file_path: fileUrl });
  } catch (err) {
    console.error('Error uploading certificate file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/certificates-reorder', authMiddleware, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Data order tidak valid.' });

    const client = getClient();
    await client.batch(
      order.map(item => ({
        sql: 'UPDATE certificates SET sort_order = ? WHERE id = ?',
        args: [item.sort_order, item.id],
      })),
      'write'
    );
    res.json({ message: 'Urutan sertifikat berhasil diperbarui.' });
  } catch (err) {
    console.error('Error reordering certificates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Ukuran file melebihi batas 10MB.' });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;
