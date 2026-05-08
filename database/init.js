const bcrypt = require('bcryptjs');
const { getClient } = require('./db');

async function initDatabase() {
  const client = getClient();

  // Create all tables
  await client.batch([
    // Profile
    `CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      full_name TEXT DEFAULT 'Rully Al Islami Muttaqin',
      tagline TEXT DEFAULT 'Network & Server Enthusiast',
      skills TEXT DEFAULT '[]',
      stat_years TEXT DEFAULT '2+',
      stat_platforms TEXT DEFAULT '3',
      about TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      linkedin TEXT DEFAULT '',
      github TEXT DEFAULT '',
      instagram TEXT DEFAULT '',
      email TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`,

    // Education
    `CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT DEFAULT '',
      institution TEXT NOT NULL,
      major TEXT DEFAULT '',
      year_start TEXT DEFAULT '',
      year_end TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,

    // Certificates
    `CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      issuer TEXT DEFAULT '',
      issued_date TEXT DEFAULT '',
      date_issued TEXT DEFAULT '',
      file_path TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,

    // Settings
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
  ], 'write');

  // Seed default profile row if not exists
  const profileCheck = await client.execute('SELECT id FROM profile WHERE id = 1');
  if (profileCheck.rows.length === 0) {
    await client.execute(
      `INSERT INTO profile (id, full_name, tagline, skills, stat_years, stat_platforms, about, photo, linkedin, github, instagram, email)
       VALUES (1, 'Rully Al Islami Muttaqin', 'Network & Server Enthusiast', '[]', '2+', '3', '', '', '', '', '', '')`
    );
  }

  // Seed admin password hash
  const pwCheck = await client.execute(`SELECT value FROM settings WHERE key = 'admin_password_hash'`);
  if (pwCheck.rows.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(adminPassword, 10);
    await client.execute({
      sql: `INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?)`,
      args: [hash],
    });
    console.log(`🔐 Admin password set. Hash saved to Turso.`);
  }
}

module.exports = { initDatabase };
