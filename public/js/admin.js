// ===== PORTFOLIO ADMIN.JS =====

const API = '/api/admin';
let token = localStorage.getItem('portfolio_admin_token');
let tokenExpiry = localStorage.getItem('portfolio_admin_expiry');
let adminCerts = [];
let adminEdu = [];
let currentSkills = [];

document.addEventListener('DOMContentLoaded', () => {
  if (token && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
    showDashboard();
  } else {
    showLogin();
  }

  document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  document.getElementById('loginBtn').addEventListener('click', login);

  document.getElementById('nav-dashboard').addEventListener('click', () => switchPage('dashboard'));
  document.getElementById('nav-profile').addEventListener('click', () => switchPage('profile'));
  document.getElementById('nav-education').addEventListener('click', () => switchPage('education'));
  document.getElementById('nav-certificates').addEventListener('click', () => switchPage('certificates'));

  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('profilePhotoInput').addEventListener('change', uploadProfilePhoto);

  // Skills
  document.getElementById('addSkillBtn').addEventListener('click', addSkill);
  document.getElementById('skillInput').addEventListener('keydown', e => { if (e.key === 'Enter') addSkill(); });

  document.getElementById('addEduBtn').addEventListener('click', () => openEduModal());
  document.getElementById('cancelEduBtn').addEventListener('click', () => closeModal('eduModal'));
  document.getElementById('saveEduBtn').addEventListener('click', saveEducation);

  document.getElementById('addCertBtn').addEventListener('click', () => openCertModal());
  document.getElementById('cancelCertBtn').addEventListener('click', () => closeModal('certModal'));
  document.getElementById('saveCertBtn').addEventListener('click', saveCertificate);

  document.getElementById('confirmCancelBtn').addEventListener('click', () => closeModal('confirmModal'));
});

// ===== AUTH =====
function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  localStorage.removeItem('portfolio_admin_token');
  localStorage.removeItem('portfolio_admin_expiry');
  token = null;
}

function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  loadDashboard();
  loadProfileForm();
  loadEduList();
  loadCertTable();
}

async function login() {
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  if (!password) { errorEl.textContent = 'Password wajib diisi.'; return; }
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error || 'Login gagal.'; return; }
    token = data.token;
    const expiry = Date.now() + (data.expiresIn * 1000);
    localStorage.setItem('portfolio_admin_token', token);
    localStorage.setItem('portfolio_admin_expiry', String(expiry));
    tokenExpiry = expiry;
    showDashboard();
  } catch (err) { errorEl.textContent = 'Gagal terhubung ke server.'; }
}

function logout() { showLogin(); toast('Berhasil logout.', 'info'); }

async function authFetch(url, options = {}) {
  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) options.headers['Content-Type'] = 'application/json';
  const res = await fetch(url, options);
  if (res.status === 401) { showLogin(); toast('Session expired. Login ulang.', 'error'); throw new Error('Unauthorized'); }
  return res;
}

// ===== NAVIGATION =====
function switchPage(page) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${page}`).classList.remove('hidden');
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById(`nav-${page}`).classList.add('active');
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ===== CUSTOM CONFIRM =====
function showConfirm(message, onOk) {
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').classList.remove('hidden');
  const okBtn = document.getElementById('confirmOkBtn');
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener('click', () => { closeModal('confirmModal'); if (onOk) onOk(); });
  const cancelBtn = document.getElementById('confirmCancelBtn');
  const newCancel = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
  newCancel.addEventListener('click', () => closeModal('confirmModal'));
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    document.getElementById('dashboardStats').innerHTML = `
      <div class="stat-card"><div class="stat-val">${stats.totalCertificates}</div><div class="stat-lbl">Total Sertifikat</div></div>
      <div class="stat-card"><div class="stat-val">${stats.totalEducation}</div><div class="stat-lbl">Riwayat Pendidikan</div></div>
    `;
  } catch (err) { console.error('Dashboard error:', err); }
}

// ===== PROFILE =====
async function loadProfileForm() {
  try {
    const res = await authFetch(`${API}/profile`);
    const p = await res.json();
    document.getElementById('pFullName').value = p.full_name || '';
    document.getElementById('pTagline').value = p.tagline || '';
    document.getElementById('pAbout').value = p.about || '';
    document.getElementById('pStatYears').value = p.stat_years || '2+';
    document.getElementById('pStatPlatforms').value = p.stat_platforms || '3';
    document.getElementById('pLinkedin').value = p.linkedin || '';
    document.getElementById('pGithub').value = p.github || '';
    document.getElementById('pInstagram').value = p.instagram || '';
    document.getElementById('pEmail').value = p.email || '';
    if (p.photo) document.getElementById('profilePhotoPreview').src = p.photo;

    currentSkills = Array.isArray(p.skills) ? [...p.skills] : [];
    renderSkillTags();
  } catch (err) { console.error('Profile load error:', err); }
}

async function saveProfile() {
  try {
    const data = {
      full_name: document.getElementById('pFullName').value,
      tagline: document.getElementById('pTagline').value,
      skills: currentSkills,
      stat_years: document.getElementById('pStatYears').value,
      stat_platforms: document.getElementById('pStatPlatforms').value,
      about: document.getElementById('pAbout').value,
      linkedin: document.getElementById('pLinkedin').value,
      github: document.getElementById('pGithub').value,
      instagram: document.getElementById('pInstagram').value,
      email: document.getElementById('pEmail').value
    };
    const res = await authFetch(`${API}/profile`, { method: 'PUT', body: JSON.stringify(data) });
    const result = await res.json();
    toast(res.ok ? 'Profil berhasil disimpan!' : (result.error || 'Gagal menyimpan.'), res.ok ? 'success' : 'error');
  } catch (err) { toast('Gagal menyimpan profil.', 'error'); }
}

async function uploadProfilePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('Ukuran file melebihi 5MB.', 'error'); return; }
  const fd = new FormData(); fd.append('photo', file);
  try {
    const res = await fetch(`${API}/profile/photo`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
    const result = await res.json();
    if (res.ok) { document.getElementById('profilePhotoPreview').src = result.photo + '?t=' + Date.now(); toast('Foto berhasil diupload!', 'success'); }
    else { toast(result.error || 'Gagal upload foto.', 'error'); }
  } catch (err) { toast('Gagal upload foto.', 'error'); }
}

// ===== SKILLS =====
function renderSkillTags() {
  const container = document.getElementById('skillTagsContainer');
  container.innerHTML = '';
  currentSkills.forEach((skill, i) => {
    const div = document.createElement('div');
    div.className = 'skill-tag';
    div.innerHTML = `${escapeHtml(skill)} <button data-idx="${i}" title="Hapus">✕</button>`;
    div.querySelector('button').addEventListener('click', () => {
      currentSkills.splice(i, 1);
      renderSkillTags();
    });
    container.appendChild(div);
  });
}

function addSkill() {
  const input = document.getElementById('skillInput');
  const val = input.value.trim();
  if (!val) return;
  if (currentSkills.includes(val)) { toast('Skill sudah ada.', 'info'); return; }
  currentSkills.push(val);
  renderSkillTags();
  input.value = '';
  input.focus();
}

// ===== EDUCATION =====
async function loadEduList() {
  try {
    const res = await authFetch(`${API}/education`);
    adminEdu = await res.json();
    renderEduList();
  } catch (err) { console.error('Education load error:', err); }
}

function renderEduList() {
  const container = document.getElementById('eduList');
  if (!adminEdu || adminEdu.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">Belum ada riwayat pendidikan. Klik "+ Tambah Pendidikan".</p>';
    return;
  }
  container.innerHTML = adminEdu.map(edu => {
    const yearStr = edu.year_start ? (edu.year_start + ' – ' + (edu.year_end || 'Sekarang')) : '';
    return `
      <div class="edu-entry" data-id="${edu.id}">
        <div class="edu-entry-info">
          <strong>${escapeHtml(edu.level ? edu.level + ' · ' : '')}${escapeHtml(edu.institution)}</strong>
          <span>${escapeHtml(edu.major || '')}${yearStr ? ' | ' + yearStr : ''}</span>
        </div>
        <div class="edu-entry-actions">
          <button class="btn btn-outline btn-sm" data-edit-edu="${edu.id}">✏️</button>
          <button class="btn btn-danger btn-sm" data-del-edu="${edu.id}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-edit-edu]').forEach(btn => {
    btn.addEventListener('click', () => openEduModal(adminEdu.find(e => e.id === parseInt(btn.dataset.editEdu))));
  });
  container.querySelectorAll('[data-del-edu]').forEach(btn => {
    btn.addEventListener('click', () => deleteEducation(parseInt(btn.dataset.delEdu)));
  });
}

function openEduModal(edu = null) {
  document.getElementById('eduModal').classList.remove('hidden');
  document.getElementById('eduModalTitle').textContent = edu ? 'Edit Pendidikan' : 'Tambah Pendidikan';
  document.getElementById('eduEditId').value = edu ? edu.id : '';
  document.getElementById('eLevel').value = edu ? (edu.level || '') : 'S1';
  document.getElementById('eInstitution').value = edu ? edu.institution : '';
  document.getElementById('eMajor').value = edu ? edu.major : '';
  document.getElementById('eYearStart').value = edu ? edu.year_start : '';
  document.getElementById('eYearEnd').value = edu ? edu.year_end : '';
}

async function saveEducation() {
  const id = document.getElementById('eduEditId').value;
  const institution = document.getElementById('eInstitution').value.trim();
  if (!institution) { toast('Nama institusi wajib diisi.', 'error'); return; }
  const data = {
    level: document.getElementById('eLevel').value,
    institution,
    major: document.getElementById('eMajor').value.trim(),
    year_start: document.getElementById('eYearStart').value.trim(),
    year_end: document.getElementById('eYearEnd').value.trim()
  };
  try {
    const url = id ? `${API}/education/${id}` : `${API}/education`;
    const method = id ? 'PUT' : 'POST';
    const res = await authFetch(url, { method, body: JSON.stringify(data) });
    const result = await res.json();
    if (res.ok) { closeModal('eduModal'); toast(id ? 'Pendidikan diperbarui!' : 'Pendidikan ditambahkan!', 'success'); loadEduList(); loadDashboard(); }
    else { toast(result.error || 'Gagal menyimpan.', 'error'); }
  } catch (err) { toast('Gagal menyimpan pendidikan.', 'error'); }
}

async function deleteEducation(id) {
  showConfirm('Hapus riwayat pendidikan ini? Tindakan tidak bisa dibatalkan.', async () => {
    try {
      const res = await authFetch(`${API}/education/${id}`, { method: 'DELETE' });
      if (res.ok) { toast('Pendidikan dihapus.', 'success'); loadEduList(); loadDashboard(); }
      else { const d = await res.json(); toast(d.error || 'Gagal menghapus.', 'error'); }
    } catch (err) { toast('Gagal menghapus pendidikan.', 'error'); }
  });
}

// ===== CERTIFICATES =====
async function loadCertTable() {
  try {
    const res = await authFetch(`${API}/certificates`);
    adminCerts = await res.json();
    renderCertTable();
  } catch (err) { console.error('Cert load error:', err); }
}

function renderCertTable() {
  const tbody = document.getElementById('certTableBody');
  if (!adminCerts || adminCerts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem">Belum ada sertifikat.</td></tr>';
    return;
  }
  tbody.innerHTML = adminCerts.map(cert => {
    const pdfHtml = cert.file_path
      ? `<span class="pdf-indicator">✅ Ada</span>`
      : `<span class="pdf-indicator none">— Belum</span>`;
    return `
      <tr data-id="${cert.id}">
        <td><strong>${escapeHtml(cert.title)}</strong></td>
        <td>${escapeHtml(cert.issuer || '-')}</td>
        <td>${pdfHtml}</td>
        <td class="tbl-actions">
          <button class="btn btn-outline btn-sm" data-edit-cert="${cert.id}">✏️</button>
          <button class="btn btn-danger btn-sm" data-del-cert="${cert.id}">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-edit-cert]').forEach(btn => {
    btn.addEventListener('click', () => openCertModal(adminCerts.find(c => c.id === parseInt(btn.dataset.editCert))));
  });
  tbody.querySelectorAll('[data-del-cert]').forEach(btn => {
    btn.addEventListener('click', () => deleteCert(parseInt(btn.dataset.delCert)));
  });
}

function openCertModal(cert = null) {
  document.getElementById('certModal').classList.remove('hidden');
  document.getElementById('certModalTitle').textContent = cert ? 'Edit Sertifikat' : 'Tambah Sertifikat';
  document.getElementById('certEditId').value = cert ? cert.id : '';
  document.getElementById('cTitle').value = cert ? cert.title : '';
  document.getElementById('cIssuer').value = cert ? cert.issuer : '';
  document.getElementById('cIssuedDate').value = cert ? (cert.issued_date || '') : '';
  document.getElementById('cFileUpload').value = '';
  const currentFileEl = document.getElementById('cCurrentFile');
  if (cert && cert.file_path) {
    currentFileEl.innerHTML = `<a href="${escapeHtml(cert.file_path)}" target="_blank" class="pdf-indicator" style="font-size:0.82rem">📄 Lihat PDF saat ini</a>`;
  } else {
    currentFileEl.innerHTML = '<span class="pdf-indicator none" style="font-size:0.82rem">Belum ada PDF</span>';
  }
}

async function saveCertificate() {
  const id = document.getElementById('certEditId').value;
  const title = document.getElementById('cTitle').value.trim();
  if (!title) { toast('Judul sertifikat wajib diisi.', 'error'); return; }
  const data = {
    title,
    issuer: document.getElementById('cIssuer').value.trim(),
    issued_date: document.getElementById('cIssuedDate').value.trim()
  };
  try {
    const url = id ? `${API}/certificates/${id}` : `${API}/certificates`;
    const method = id ? 'PUT' : 'POST';
    const res = await authFetch(url, { method, body: JSON.stringify(data) });
    const result = await res.json();
    if (!res.ok) { toast(result.error || 'Gagal menyimpan.', 'error'); return; }
    const certId = id || result.certificate.id;
    const fileInput = document.getElementById('cFileUpload');
    if (fileInput.files[0]) {
      if (fileInput.files[0].size > 10 * 1024 * 1024) { toast('File PDF melebihi 10MB.', 'error'); return; }
      const fd = new FormData(); fd.append('certificate', fileInput.files[0]);
      const upRes = await fetch(`${API}/certificates/${certId}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (!upRes.ok) { const up = await upRes.json(); toast(up.error || 'Gagal upload PDF.', 'error'); return; }
    }
    closeModal('certModal');
    toast(id ? 'Sertifikat diperbarui!' : 'Sertifikat ditambahkan!', 'success');
    loadCertTable(); loadDashboard();
  } catch (err) { toast('Gagal menyimpan sertifikat.', 'error'); }
}

async function deleteCert(certId) {
  showConfirm('Hapus sertifikat ini? File PDF juga akan dihapus.', async () => {
    try {
      const res = await authFetch(`${API}/certificates/${certId}`, { method: 'DELETE' });
      if (res.ok) { toast('Sertifikat dihapus.', 'success'); loadCertTable(); loadDashboard(); }
      else { const d = await res.json(); toast(d.error || 'Gagal menghapus.', 'error'); }
    } catch (err) { toast('Gagal menghapus sertifikat.', 'error'); }
  });
}

// ===== UTILITIES =====
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text || '';
  return d.innerHTML;
}
