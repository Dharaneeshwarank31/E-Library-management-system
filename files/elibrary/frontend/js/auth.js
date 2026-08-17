// ── CONFIG ─────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

// ── HELPERS ────────────────────────────────────────────
function showToast(message, type = 'error') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 4000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  if (loading) { text.classList.add('hidden'); loader.classList.remove('hidden'); }
  else { text.classList.remove('hidden'); loader.classList.add('hidden'); }
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('form-login').classList.toggle('active', tab === 'login');
  document.getElementById('form-register').classList.toggle('active', tab === 'register');
  document.getElementById('toast').className = 'toast';
}

// ── LOGIN ──────────────────────────────────────────────
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  setLoading('btn-login', true);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('elibrary_token', data.token);
      localStorage.setItem('elibrary_user', JSON.stringify(data.user));
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
      const msg = data.errors ? data.errors[0].msg : data.message;
      showToast(msg);
    }
  } catch (err) {
    showToast('Cannot connect to server. Is the backend running?');
  } finally {
    setLoading('btn-login', false);
  }
}

// ── REGISTER ───────────────────────────────────────────
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (password !== confirm) { showToast('Passwords do not match.'); return; }
  if (password.length < 6) { showToast('Password must be at least 6 characters.'); return; }

  setLoading('btn-register', true);

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('elibrary_token', data.token);
      localStorage.setItem('elibrary_user', JSON.stringify(data.user));
      showToast('Account created! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
      const msg = data.errors ? data.errors[0].msg : data.message;
      showToast(msg);
    }
  } catch (err) {
    showToast('Cannot connect to server. Is the backend running?');
  } finally {
    setLoading('btn-register', false);
  }
}

// ── AUTO-REDIRECT if already logged in ─────────────────
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('elibrary_token');
  if (token) window.location.href = 'dashboard.html';
});
