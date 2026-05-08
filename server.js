require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Static files (public folder only — uploads now on Cloudinary)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api', apiRoutes);
app.use('/api/admin', (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') return loginLimiter(req, res, next);
  next();
}, adminRoutes);

// Hidden admin panel
app.get('/manage-portfolio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

// Boot — init DB first, then start server
(async () => {
  try {
    console.log('🗄️  Connecting to Turso database...');
    await initDatabase();
    console.log('✅ Database ready.\n');

    app.listen(PORT, () => {
      console.log(`🚀 Portfolio server running at http://localhost:${PORT}`);
      console.log(`🔐 Admin panel: http://localhost:${PORT}/manage-portfolio`);
      console.log(`☁️  Storage: Cloudinary (cloud)`);
      console.log(`🗃️  Database: Turso (cloud SQLite)\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
})();
