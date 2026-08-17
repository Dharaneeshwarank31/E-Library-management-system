// ── CONFIG ─────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

let currentUser = null;
let allBooks = [];
let debounceTimer = null;

// ── AUTH GUARD ─────────────────────────────────────────
function getToken() {
  const token = localStorage.getItem('elibrary_token');
  if (!token) { window.location.href = 'index.html'; return null; }
  return token;
}

function logout() {
  localStorage.removeItem('elibrary_token');
  localStorage.removeItem('elibrary_user');
  window.location.href = 'index.html';
}

// ── HELPERS ────────────────────────────────────────────
function showToast(message, type = 'error') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 4000);
}

function apiHeaders() {
  return { 'Authorization': `Bearer ${getToken()}` };
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  // Close sidebar on mobile
  if (window.innerWidth <= 900) toggleSidebar();
}

function setColor(hex) {
  document.getElementById('book-color').value = hex;
}

// ── INIT ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (!token) return;

  // Load user from localStorage
  try {
    currentUser = JSON.parse(localStorage.getItem('elibrary_user'));
  } catch { logout(); return; }

  // Setup user UI
  const initial = (currentUser.name || 'U')[0].toUpperCase();
  document.getElementById('user-avatar').textContent = initial;
  document.getElementById('topbar-avatar').textContent = initial;
  document.getElementById('sidebar-name').textContent = currentUser.name;
  document.getElementById('sidebar-role').textContent = currentUser.role;

  // Show admin features
  if (currentUser.role === 'admin') {
    document.getElementById('nav-upload').style.display = 'flex';
  }

  // Load books and categories
  await loadBooks();
  await loadCategories();
});

// ── LOAD BOOKS ─────────────────────────────────────────
async function loadBooks(search = '', category = '') {
  const grid = document.getElementById('books-grid');
  grid.innerHTML = `<div class="loading-state"><span class="spinner">⟳</span><p>Loading your library...</p></div>`;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);

  try {
    const res = await fetch(`${API_BASE}/books?${params}`, { headers: apiHeaders() });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();

    if (!data.success) { showToast(data.message); return; }

    allBooks = data.books;
    document.getElementById('books-count').textContent =
      `${data.count} book${data.count !== 1 ? 's' : ''} in the library`;

    renderBooks(allBooks);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><h3>Cannot connect to server</h3><p>Make sure the backend is running at ${API_BASE}</p></div>`;
  }
}

function renderBooks(books) {
  const grid = document.getElementById('books-grid');

  if (books.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><h3>No books found</h3><p>Try a different search, or ask an admin to upload books.</p></div>`;
    return;
  }

  grid.innerHTML = books.map((book, i) => `
    <div class="book-card" style="animation-delay: ${i * 0.05}s">
      <div class="book-cover" style="background: linear-gradient(135deg, ${book.cover_color || '#4F46E5'}, ${adjustColor(book.cover_color || '#4F46E5', -40)})">
        📖
        <span class="book-spine-text">${escHtml(book.title)}</span>
        ${currentUser?.role === 'admin' ? `<button class="book-delete-btn" onclick="deleteBook(${book.id}, event)" title="Delete book">✕</button>` : ''}
      </div>
      <div class="book-info">
        <div class="book-title">${escHtml(book.title)}</div>
        <div class="book-author">by ${escHtml(book.author)}</div>
        ${book.category ? `<span class="book-category">${escHtml(book.category)}</span>` : ''}
        <button class="book-open-btn" onclick="openPDF(${book.id}, '${escHtml(book.title)}')">
          📄 Open PDF
        </button>
      </div>
    </div>
  `).join('');
}

// ── OPEN PDF ───────────────────────────────────────────
function openPDF(bookId, title) {
  const token = getToken();
  // Open PDF in new tab — token passed as URL param for simple auth
  const url = `${API_BASE}/books/${bookId}/pdf?token=${token}`;
  window.open(url, '_blank');
}

// ── SEARCH / FILTER ────────────────────────────────────
function handleSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const search = document.getElementById('search-input').value.trim();
    const category = document.getElementById('category-filter').value;
    loadBooks(search, category);
  }, 350);
}

// ── LOAD CATEGORIES ────────────────────────────────────
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/books/categories`, { headers: apiHeaders() });
    const data = await res.json();
    if (!data.success) return;

    const select = document.getElementById('category-filter');
    data.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  } catch { /* ignore */ }
}

// ── UPLOAD BOOK (admin) ────────────────────────────────
function handleFileSelect(input) {
  const zone = document.getElementById('drop-zone');
  const inner = document.getElementById('drop-inner');
  if (input.files.length > 0) {
    const file = input.files[0];
    zone.classList.add('has-file');
    inner.innerHTML = `<span class="drop-icon">✅</span><p>${escHtml(file.name)}</p><small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>`;
  }
}

async function handleUpload(event) {
  event.preventDefault();
  const title = document.getElementById('book-title').value.trim();
  const author = document.getElementById('book-author').value.trim();
  const category = document.getElementById('book-category').value.trim();
  const description = document.getElementById('book-desc').value.trim();
  const color = document.getElementById('book-color').value;
  const file = document.getElementById('pdf-file').files[0];

  if (!file) { showToast('Please select a PDF file.'); return; }

  const btn = document.getElementById('btn-upload');
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = true; text.classList.add('hidden'); loader.classList.remove('hidden');

  const formData = new FormData();
  formData.append('title', title);
  formData.append('author', author);
  formData.append('category', category);
  formData.append('description', description);
  formData.append('cover_color', color);
  formData.append('pdf', file);

  try {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: apiHeaders(),
      body: formData,
    });
    const data = await res.json();

    if (data.success) {
      showToast('Book uploaded successfully! 🎉', 'success');
      resetUploadForm();
      showSection('books');
      await loadBooks();
      await loadCategories();
    } else {
      showToast(data.message || 'Upload failed.');
    }
  } catch (err) {
    showToast('Upload failed. Check your connection.');
  } finally {
    btn.disabled = false; text.classList.remove('hidden'); loader.classList.add('hidden');
  }
}

function resetUploadForm() {
  document.getElementById('upload-form').reset();
  document.getElementById('drop-zone').classList.remove('has-file');
  document.getElementById('drop-inner').innerHTML = `
    <span class="drop-icon">📄</span>
    <p>Click to upload or drag & drop PDF here</p>
    <small>Max file size: 50MB</small>`;
  document.getElementById('book-color').value = '#4F46E5';
}

// ── DELETE BOOK (admin) ────────────────────────────────
async function deleteBook(bookId, event) {
  event.stopPropagation();
  if (!confirm('Delete this book? This cannot be undone.')) return;

  try {
    const res = await fetch(`${API_BASE}/books/${bookId}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    });
    const data = await res.json();

    if (data.success) {
      showToast('Book deleted.', 'success');
      await loadBooks();
    } else {
      showToast(data.message);
    }
  } catch { showToast('Delete failed.'); }
}

// ── DRAG & DROP support ────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const zone = document.getElementById('drop-zone');
  if (!zone) return;

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--gold)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      const input = document.getElementById('pdf-file');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileSelect(input);
    } else {
      showToast('Only PDF files allowed.');
    }
  });
});

// ── UTILITIES ─────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Darken a hex color by amount
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
