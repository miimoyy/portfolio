// ===== PORTFOLIO PUBLIC MAIN.JS =====

document.addEventListener('DOMContentLoaded', () => {
  AOS.init({ duration: 650, easing: 'ease-out-cubic', once: true, offset: 60 });
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  initNavbar();
  loadPublicData();
  initSearch();
});

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink();
  });
  toggle.addEventListener('click', () => { links.classList.toggle('open'); overlay.classList.toggle('open'); });
  overlay.addEventListener('click', () => { links.classList.remove('open'); overlay.classList.remove('open'); });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => { links.classList.remove('open'); overlay.classList.remove('open'); });
  });
}

function updateActiveLink() {
  const scrollPos = window.scrollY + 160;
  ['hero', 'about', 'skills', 'projects', 'certificates', 'contact'].forEach(id => {
    const sec = document.getElementById(id);
    const link = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (!sec || !link) return;
    if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
      document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

// ===== LOAD ALL DATA =====
let allCerts = [];

async function loadPublicData() {
  try {
    const [profileRes, eduRes, certRes, statsRes] = await Promise.all([
      fetch('/api/profile'),
      fetch('/api/education'),
      fetch('/api/certificates'),
      fetch('/api/stats')
    ]);

    const profile = await profileRes.json();
    const education = await eduRes.json();
    allCerts = await certRes.json();
    const stats = await statsRes.json();

    renderProfile(profile, stats);
    renderSkillBadges(profile.skills || []);
    renderHeroSocials(profile);       // === FITUR 2 ===
    renderAboutEducation(education);
    renderSocialLinks(profile);
    renderCertificates(allCerts);
    renderSkillsSection();            // === FITUR 3 ===
    renderProjects();                 // === PROJECTS ===
    renderContactSection(profile);    // === FITUR 1 ===

    document.getElementById('footerName').textContent = profile.full_name || 'Portfolio';
    document.title = `Portfolio - ${profile.full_name || 'Portfolio'}`;
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

function renderProfile(p, stats) {
  document.getElementById('heroName').textContent = p.full_name || 'Rully Al Islami Muttaqin';
  // Use innerHTML so stored & renders correctly (sanitized server-side)
  document.getElementById('heroTagline').innerHTML = decodeHTML(p.tagline || 'Network & Server Enthusiast');
  document.getElementById('aboutText').textContent = decodeHTML(p.about || '');
  document.getElementById('aboutName').textContent = p.full_name || '-';
  document.getElementById('aboutCertCount').textContent = stats.totalCertificates || 0;
  // Quick stats
  document.getElementById('statCerts').textContent = stats.totalCertificates || 0;
  document.getElementById('statYears').textContent = p.stat_years || '2+';
  document.getElementById('statPlatforms').textContent = p.stat_platforms || '3';
  if (p.photo) document.getElementById('heroPhoto').src = p.photo;
}

const SKILL_ICONS = {
  'mikrotik': '🌐', 'linux': '🐧', 'docker': '🐳',
  'ansible': '⚙️', 'python': '🐍', 'kubernetes': '☸️',
  'nginx': '🔧', 'git': '🌿', 'bash': '💻', 'cisco': '🖧',
  'windows server': '🪟', 'ubuntu': '🐧', 'centos': '🐧',
  'postgresql': '🐘', 'mysql': '🗄️', 'redis': '🔴',
  'terraform': '🏗️', 'prometheus': '📊', 'grafana': '📈',
};

function getSkillIcon(skill) {
  return SKILL_ICONS[skill.toLowerCase()] || '⚡';
}

function renderSkillBadges(skills) {
  const container = document.getElementById('skillBadges');
  container.innerHTML = '';
  if (!skills || skills.length === 0) return;
  skills.forEach(skill => {
    const span = document.createElement('span');
    span.className = 'skill-badge';
    span.innerHTML = `<span class="skill-icon">${getSkillIcon(skill)}</span>${escapeHtml(skill)}`;
    container.appendChild(span);
  });
}

function renderAboutEducation(education) {
  const list = document.getElementById('aboutEduList');
  list.innerHTML = '';
  if (!education || education.length === 0) {
    list.innerHTML = '<li class="edu-list-item" style="color:var(--text-muted)">-</li>';
    return;
  }
  education.forEach(edu => {
    const li = document.createElement('li');
    li.className = 'edu-list-item';
    const yearStr = edu.year_start ? (edu.year_start + ' – ' + (edu.year_end || 'Sekarang')) : '';
    li.innerHTML = `
      ${edu.level ? `<span class="edu-level">${escapeHtml(edu.level)}</span>` : ''}
      ${escapeHtml(edu.institution)}${edu.major ? ' · ' + escapeHtml(edu.major) : ''}
      ${yearStr ? `<span class="edu-year"> (${yearStr})</span>` : ''}
    `;
    list.appendChild(li);
  });
}

function renderSocialLinks(p) {
  const container = document.getElementById('footerSocials');
  container.innerHTML = '';
  const socials = [
    { url: p.linkedin, title: 'LinkedIn', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
    { url: p.github, title: 'GitHub', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>' },
    { url: p.instagram, title: 'Instagram', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>' },
    { url: p.email ? `mailto:${p.email}` : '', title: 'Email', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>' }
  ];
  socials.forEach(s => {
    if (!s.url) return;
    const a = document.createElement('a');
    a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = s.title;
    a.innerHTML = s.icon;
    container.appendChild(a);
  });
}

// ===== CERTIFICATES =====
function renderCertificates(certs) {
  const grid = document.getElementById('certGrid');
  grid.innerHTML = '';
  if (!certs || certs.length === 0) {
    grid.innerHTML = `<div class="cert-empty"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"/></svg><p>Belum ada sertifikat.</p></div>`;
    return;
  }
  certs.forEach((cert, i) => {
    const card = document.createElement('div');
    card.className = 'cert-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', String(Math.min(i * 70, 350)));
    card.innerHTML = `
      <h3>${escapeHtml(cert.title)}</h3>
      <p class="cert-issuer">${escapeHtml(cert.issuer || '-')}</p>
      <hr class="cert-sep">
      ${cert.issued_date ? `
        <p class="cert-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ef4444;flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${formatCertDate(cert.issued_date)}
        </p>` : ''}
      <div class="cert-actions">
        ${cert.file_path
          ? `<a href="${escapeHtml(cert.file_path)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm cert-btn-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Lihat Sertifikat
            </a>`
          : '<span style="font-size:0.8rem;color:var(--text-muted)">PDF belum diupload</span>'}
      </div>
    `;
    grid.appendChild(card);
  });
  AOS.refresh();
}

function initSearch() {
  let timeout;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      renderCertificates(q
        ? allCerts.filter(c => (c.title || '').toLowerCase().includes(q) || (c.issuer || '').toLowerCase().includes(q))
        : allCerts
      );
    }, 280);
  });
}

// ===== FITUR 2: HERO SOCIALS =====
function renderHeroSocials(p) {
  const container = document.getElementById('heroSocials');
  if (!container) return;
  container.innerHTML = '';
  const items = [
    { url: p.github,    title: 'GitHub',    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>` },
    { url: p.linkedin,  title: 'LinkedIn',  icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` },
    { url: p.instagram, title: 'Instagram', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>` },
    { url: p.email ? `mailto:${p.email}` : '', title: 'Email', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>` }
  ];
  items.forEach(item => {
    if (!item.url) return;
    const a = document.createElement('a');
    a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = item.title;
    a.innerHTML = item.icon;
    container.appendChild(a);
  });
}

// ===== FITUR 3: SKILLS SECTION (hardcoded categories) =====
function renderSkillsSection() {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;

  const categories = [
    {
      icon: '🌐', title: 'Networking', subtitle: 'Infrastruktur Jaringan',
      skills: [
        { icon: '🌐', name: 'MikroTik' },
        { icon: '🔀', name: 'BGP' },
        { icon: '🔁', name: 'OSPF' },
        { icon: '🏷️', name: 'VLAN' },
        { icon: '🔥', name: 'Firewall' },
        { icon: '🔄', name: 'NAT' },
        { icon: '📋', name: 'DHCP' },
      ]
    },
    {
      icon: '🛠️', title: 'DevOps & Server', subtitle: 'Automasi & Infrastructure',
      skills: [
        { icon: '🐳', name: 'Docker' },
        { icon: '⚙️', name: 'Ansible' },
        { icon: '🔧', name: 'Nginx' },
        { icon: '🐧', name: 'Ubuntu Server' },
        { icon: '🐧', name: 'Linux' },
      ]
    },
    {
      icon: '📊', title: 'Monitoring & Observability', subtitle: 'Pemantauan Sistem & Jaringan',
      skills: [
        { icon: '📈', name: 'Grafana' },
        { icon: '🔭', name: 'Prometheus' },
        { icon: '🤖', name: 'Telegram Bot API' },
      ]
    }
  ];

  grid.innerHTML = categories.map((cat, i) => `
    <div class="skill-category" data-aos="fade-up" data-aos-delay="${i * 100}">
      <div class="skill-category-header">
        <span class="skill-category-icon">${cat.icon}</span>
        <div>
          <div class="skill-category-title">${cat.title}</div>
          <div class="skill-category-subtitle">${cat.subtitle}</div>
        </div>
      </div>
      <div class="skill-pills">
        ${cat.skills.map(s => `
          <span class="skill-pill">
            <span class="skill-pill-icon">${s.icon}</span>${escapeHtml(s.name)}
          </span>
        `).join('')}
      </div>
    </div>
  `).join('');
  AOS.refresh();
}

// ===== FITUR 1: CONTACT SECTION =====
function renderContactSection(p) {
  const grid = document.getElementById('contactGrid');
  if (!grid) return;

  const contacts = [
    {
      label: 'Email',
      value: p.email || null,
      url: p.email ? `mailto:${p.email}` : null,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>`
    },
    {
      label: 'GitHub',
      value: p.github ? p.github.replace('https://', '').replace('http://', '') : null,
      url: p.github || null,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`
    },
    {
      label: 'LinkedIn',
      value: p.linkedin ? p.linkedin.replace('https://', '').replace('http://', '') : null,
      url: p.linkedin || null,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
    },
    {
      label: 'Instagram',
      value: p.instagram ? p.instagram.replace('https://', '').replace('http://', '') : null,
      url: p.instagram || null,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`
    }
  ];

  const active = contacts.filter(c => c.url);
  if (active.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Belum ada kontak diisi.</p>';
    return;
  }

  grid.innerHTML = active.map(c => `
    <a class="contact-card" href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">
      <div class="contact-icon">${c.icon}</div>
      <div class="contact-info">
        <div class="contact-info-label">${escapeHtml(c.label)}</div>
        <div class="contact-info-value" title="${escapeHtml(c.value)}">${escapeHtml(c.value)}</div>
      </div>
    </a>
  `).join('');
}

// ===== PROJECTS SECTION =====
function renderProjects() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;

  const projects = [
    {
      title: 'Sistem Monitoring Arus Listrik Berbasis IoT',
      desc: 'Sistem pemantauan arus listrik real-time menggunakan sensor SCT013 dan ESP32. Sistem otomatis mengirim notifikasi ke Telegram ketika arus melewati batas threshold yang ditentukan.',
      category: 'IoT / Hardware',
      badgeClass: 'badge-iot',
      icon: '🔌',
      tech: ['ESP32', 'SCT013', 'IoT', 'Telegram Bot API', 'Arduino C']
    },
    {
      title: 'Website Apotek + Deployment Docker',
      desc: 'Membangun website manajemen apotek lengkap dan melakukan containerisasi menggunakan Docker untuk deployment yang konsisten dan mudah di-maintain.',
      category: 'Web & DevOps',
      badgeClass: 'badge-web',
      icon: '🌐',
      tech: ['Docker', 'Web Development', 'Container']
    },
    {
      title: 'Konfigurasi Routing BGP & OSPF MikroTik',
      desc: 'Implementasi dan konfigurasi protokol routing dinamis BGP dan OSPF pada perangkat MikroTik untuk manajemen jaringan enterprise yang efisien.',
      category: 'Networking',
      badgeClass: 'badge-network',
      icon: '🖧',
      tech: ['MikroTik', 'BGP', 'OSPF', 'Networking']
    },
    {
      title: 'Konfigurasi Dasar MikroTik Router',
      desc: 'Setup dan konfigurasi awal MikroTik meliputi firewall, NAT, DHCP server, dan manajemen bandwidth untuk jaringan lokal.',
      category: 'Networking',
      badgeClass: 'badge-network',
      icon: '📡',
      tech: ['MikroTik', 'Firewall', 'NAT', 'DHCP']
    },
    {
      title: 'Setup Server Linux (Nginx, DHCP, DNS)',
      desc: 'Konfigurasi server Linux dari awal mencakup web server Nginx, DHCP server untuk manajemen IP otomatis, dan DNS server untuk resolusi nama domain internal.',
      category: 'Server / Linux',
      badgeClass: 'badge-server',
      icon: '🖥️',
      tech: ['Linux', 'Nginx', 'DHCP', 'DNS', 'Server']
    }
  ];

  grid.innerHTML = projects.map((p, i) => `
    <div class="project-card" data-aos="fade-up" data-aos-delay="${Math.min(i * 80, 320)}">
      <div class="project-card-top">
        <span class="project-category-badge ${escapeHtml(p.badgeClass)}">${escapeHtml(p.category)}</span>
        <span class="project-icon">${p.icon}</span>
      </div>
      <div class="project-title">${escapeHtml(p.title)}</div>
      <p class="project-desc">${escapeHtml(p.desc)}</p>
      <div class="project-tech">
        ${p.tech.map(t => `<span>${escapeHtml(t)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  AOS.refresh();
}

function formatCertDate(val) {
  if (!val) return '';
  // val format: "YYYY-MM" (from <input type="month">)
  try {
    const [year, month] = val.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } catch { return val; }
}

// Decode HTML entities (e.g. &amp; → &, &lt; → <)
// Menggunakan textarea agar aman dari XSS
function decodeHTML(str) {
  if (!str) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text || '';
  return d.innerHTML;
}

