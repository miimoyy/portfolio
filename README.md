# 🚀 Portfolio Website

Website portfolio pribadi modern dengan sistem admin tersembunyi untuk mengelola konten.

## Stack Teknologi
- **Frontend**: HTML + Vanilla CSS + Vanilla JS + AOS.js
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt
- **Upload**: Multer (PDF only, max 10MB)

---

## ⚡ Install & Jalankan

### 1. Masuk ke folder project
```bash
cd portfolio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set konfigurasi di file `.env`
```env
ADMIN_PASSWORD=password_anda_disini
JWT_SECRET=ganti_dengan_string_random_panjang
PORT=3000
```

### 4. Jalankan server
```bash
npm start
```

Website tersedia di: **http://localhost:3000**

---

## 🔐 Akses Admin Panel

URL Admin (tersembunyi, tidak ada di navbar/footer publik):
```
http://localhost:3000/manage-portfolio
```

Login dengan password yang di-set di `.env` > `ADMIN_PASSWORD`.

**Default password**: `admin123` (wajib diganti sebelum deploy!)

### Fitur Admin:
- **Dashboard** — statistik sertifikat dan pendidikan
- **Edit Profil** — nama, bio, foto, social links
- **Riwayat Pendidikan** — CRUD multiple entry (SD/SMP/SMA/SMK/D1-S3)
- **Kelola Sertifikat** — CRUD, upload PDF (max 10MB)

---

## 📁 Struktur Folder

```
portfolio/
├── database/
│   ├── init.js        # Inisialisasi SQLite
│   └── portfolio.db   # File database (auto-generated)
├── middleware/
│   └── auth.js        # JWT auth middleware
├── public/
│   ├── css/style.css  # Stylesheet utama
│   ├── js/
│   │   ├── main.js    # Frontend publik
│   │   └── admin.js   # Frontend admin
│   ├── assets/        # Foto profil default
│   ├── index.html     # Halaman publik
│   └── admin.html     # Admin panel (tersembunyi)
├── routes/
│   ├── api.js         # API publik
│   └── admin.js       # API admin (protected)
├── uploads/
│   ├── certificates/  # File PDF sertifikat
│   └── profile/       # Foto profil
├── .env               # Konfigurasi (jangan commit!)
├── .env.example       # Template konfigurasi
├── server.js          # Entry point
└── package.json
```

---

## 💾 Backup Data

Database tersimpan dalam 1 file SQLite:
```bash
# Backup database
cp database/portfolio.db database/portfolio.db.backup

# Backup semua uploads
tar -czf uploads-backup.tar.gz uploads/
```

---

## 🔒 Keamanan

- Password admin di-hash dengan bcrypt
- File upload: hanya PDF, max 10MB
- Rate limiting login: max 5 percobaan/menit
- JWT session: 2 jam
- Input sanitasi dengan sanitize-html
- Helmet.js security headers

---

## ⚙️ Environment Variables

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `ADMIN_PASSWORD` | Password login admin | `admin123` |
| `JWT_SECRET` | Secret key JWT | wajib diisi |
| `PORT` | Port server | `3000` |
