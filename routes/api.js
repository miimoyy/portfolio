const express = require('express');
const router = express.Router();
const { getClient } = require('../database/db');
const sanitizeHtml = require('sanitize-html');

function sanitize(str) {
  if (!str) return '';
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });
}

// GET /api/profile
router.get('/profile', async (req, res) => {
  try {
    const client = getClient();
    const result = await client.execute('SELECT * FROM profile WHERE id = 1');
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    const profile = { ...result.rows[0] };
    try { profile.skills = JSON.parse(profile.skills || '[]'); } catch { profile.skills = []; }
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/education
router.get('/education', async (req, res) => {
  try {
    const client = getClient();
    const result = await client.execute('SELECT * FROM education ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching education:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/certificates
router.get('/certificates', async (req, res) => {
  try {
    const client = getClient();
    const { search } = req.query;
    let sql = 'SELECT * FROM certificates WHERE 1=1';
    const args = [];
    if (search) {
      sql += ' AND (title LIKE ? OR issuer LIKE ?)';
      const term = `%${sanitize(search)}%`;
      args.push(term, term);
    }
    sql += ' ORDER BY sort_order ASC';
    const result = await client.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const client = getClient();
    const [certRes, eduRes] = await Promise.all([
      client.execute('SELECT COUNT(*) as count FROM certificates'),
      client.execute('SELECT COUNT(*) as count FROM education'),
    ]);
    res.json({
      totalCertificates: Number(certRes.rows[0].count),
      totalEducation: Number(eduRes.rows[0].count),
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
