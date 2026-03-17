'use strict';

/* ─── CREDENTIALS ─────────────────────────────────────────────────────────── */
const _AU = 'svvipee';
const _AP = 'svvipee';

/* ─── STORAGE KEYS ────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'hamza_pf_edits_v1';
const SESSION_KEY = 'hamza_pf_admin';

/* ─── INJECT ADMIN STYLES ─────────────────────────────────────────────────── */
(function injectStyles() {
  const s = document.createElement('style');
  s.id = 'admin-styles';
  s.textContent = `
    #admin-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: rgba(6,6,6,0.98); border-bottom: 1px solid #222;
      padding: 0.45rem 1.25rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      backdrop-filter: blur(10px);
    }
    .admin-bar-inner {
      max-width: 1080px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }
    .admin-bar-label {
      font-size: 0.7rem; color: #555; letter-spacing: 0.14em;
      text-transform: uppercase; user-select: none;
    }
    .admin-bar-label em { color: #999; font-style: normal; }
    .admin-bar-actions { display: flex; gap: 0.4rem; align-items: center; }
    .adm-btn {
      font-size: 0.7rem; padding: 0.28rem 0.75rem; border-radius: 999px;
      border: 1px solid #262626; background: transparent; color: #888;
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit; line-height: 1.4;
    }
    .adm-btn:hover { background: #1a1a1a; border-color: #444; color: #ddd; }
    .adm-btn--save { border-color: #383838; color: #ccc; }
    .adm-btn--save:hover { background: #1e1e1e; border-color: #555; color: #fff; }
    body.admin-active { padding-top: 37px; }

    /* editable field highlights */
    [data-editable][contenteditable="true"] {
      outline: 1px dashed rgba(255,255,255,0.14);
      border-radius: 3px; min-height: 1em; cursor: text;
      transition: outline-color 0.15s;
    }
    [data-editable][contenteditable="true"]:hover {
      outline-color: rgba(255,255,255,0.32);
    }
    [data-editable][contenteditable="true"]:focus {
      outline: 1px solid rgba(255,255,255,0.55);
      background: rgba(255,255,255,0.025);
    }

    /* login modal */
    #admin-modal {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .adm-backdrop {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.88); backdrop-filter: blur(12px);
    }
    .adm-box {
      position: relative; z-index: 1;
      background: #0c0c0c; border: 1px solid #1e1e1e; border-radius: 16px;
      padding: 1.6rem 1.5rem; width: 100%; max-width: 296px;
      display: flex; flex-direction: column; gap: 0.7rem;
      box-shadow: 0 40px 80px rgba(0,0,0,0.9);
    }
    .adm-title {
      font-size: 0.82rem; font-weight: 600; color: #e0e0e0;
      letter-spacing: 0.06em; text-transform: uppercase;
    }
    .adm-input {
      background: #070707; border: 1px solid #1e1e1e; border-radius: 8px;
      color: #f0f0f0; padding: 0.5rem 0.75rem; font-size: 0.82rem;
      outline: none; width: 100%; transition: border-color 0.15s;
      font-family: inherit;
    }
    .adm-input:focus { border-color: #444; }
    .adm-error { font-size: 0.7rem; color: #555; min-height: 0.9rem; }
    .adm-actions { display: flex; gap: 0.4rem; justify-content: flex-end; margin-top: 0.1rem; }

    /* hidden admin dot in footer */
    #admin-trigger {
      display: inline-block; width: 7px; height: 7px; border-radius: 50%;
      background: transparent; cursor: pointer; opacity: 0;
      transition: opacity 0.25s, background 0.25s;
      vertical-align: middle; margin-left: 6px;
    }
    #admin-trigger:hover { opacity: 0.35; background: #fff; }
  `;
  document.head.appendChild(s);
})();

/* ─── LOAD SAVED EDITS (runs immediately, before DOMContentLoaded) ─────────── */
function loadEdits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const edits = JSON.parse(raw);
    Object.entries(edits).forEach(([key, html]) => {
      const el = document.querySelector(`[data-editable="${key}"]`);
      if (el) el.innerHTML = html;
    });
  } catch (e) { /* silently ignore parse errors */ }
}

/* ─── SAVE EDITS ──────────────────────────────────────────────────────────── */
function saveEdits() {
  const edits = {};
  document.querySelectorAll('[data-editable]').forEach(el => {
    edits[el.dataset.editable] = el.innerHTML;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
  flashSave();
}

function flashSave() {
  const btn = document.getElementById('adm-save-btn');
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = 'Saved ✓';
  btn.style.color = '#aaa';
  setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2200);
}

function resetEdits() {
  if (!confirm('Clear all saved edits and restore original content?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

/* ─── SESSION ─────────────────────────────────────────────────────────────── */
function isAdmin() { return sessionStorage.getItem(SESSION_KEY) === '1'; }

function enterAdmin() {
  sessionStorage.setItem(SESSION_KEY, '1');
  renderAdminBar();
  enableEditing();
  document.body.classList.add('admin-active');
}

function exitAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('admin-bar')?.remove();
  disableEditing();
  document.body.classList.remove('admin-active');
}

/* ─── EDITING ─────────────────────────────────────────────────────────────── */
function enableEditing() {
  document.querySelectorAll('[data-editable]').forEach(el => {
    el.contentEditable = 'true';
  });
}

function disableEditing() {
  document.querySelectorAll('[data-editable]').forEach(el => {
    el.contentEditable = 'false';
  });
}

/* ─── ADMIN BAR ───────────────────────────────────────────────────────────── */
function renderAdminBar() {
  if (document.getElementById('admin-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'admin-bar';
  bar.innerHTML = `
    <div class="admin-bar-inner">
      <span class="admin-bar-label">⚙&nbsp; <em>Admin —</em> click any field to edit</span>
      <div class="admin-bar-actions">
        <button id="adm-save-btn" class="adm-btn adm-btn--save">Save Changes</button>
        <button id="adm-reset-btn" class="adm-btn">Reset All</button>
        <button id="adm-exit-btn" class="adm-btn">Exit</button>
      </div>
    </div>
  `;
  document.body.prepend(bar);
  document.getElementById('adm-save-btn').addEventListener('click', saveEdits);
  document.getElementById('adm-reset-btn').addEventListener('click', resetEdits);
  document.getElementById('adm-exit-btn').addEventListener('click', exitAdmin);
}

/* ─── LOGIN MODAL ─────────────────────────────────────────────────────────── */
function showLogin() {
  if (document.getElementById('admin-modal')) return;
  const m = document.createElement('div');
  m.id = 'admin-modal';
  m.innerHTML = `
    <div class="adm-backdrop" id="adm-bd"></div>
    <div class="adm-box">
      <div class="adm-title">Admin Login</div>
      <input id="adm-u" class="adm-input" type="text"     placeholder="Username" autocomplete="off" spellcheck="false" />
      <input id="adm-p" class="adm-input" type="password" placeholder="Password" autocomplete="off" />
      <div class="adm-error" id="adm-err"></div>
      <div class="adm-actions">
        <button class="adm-btn" id="adm-cancel">Cancel</button>
        <button class="adm-btn adm-btn--save" id="adm-login">Login</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  document.getElementById('adm-cancel').addEventListener('click', hideLogin);
  document.getElementById('adm-bd').addEventListener('click', hideLogin);
  document.getElementById('adm-login').addEventListener('click', tryLogin);
  document.getElementById('adm-p').addEventListener('keydown', e => {
    if (e.key === 'Enter') tryLogin();
  });
  document.addEventListener('keydown', escClose);
  setTimeout(() => document.getElementById('adm-u')?.focus(), 40);
}

function escClose(e) {
  if (e.key === 'Escape') { hideLogin(); document.removeEventListener('keydown', escClose); }
}

function hideLogin() {
  document.getElementById('admin-modal')?.remove();
  document.removeEventListener('keydown', escClose);
}

function tryLogin() {
  const u = document.getElementById('adm-u')?.value.trim();
  const p = document.getElementById('adm-p')?.value;
  if (u === _AU && p === _AP) {
    hideLogin();
    enterAdmin();
  } else {
    const err = document.getElementById('adm-err');
    if (err) err.textContent = 'Invalid credentials.';
    const pi = document.getElementById('adm-p');
    if (pi) { pi.value = ''; pi.focus(); }
  }
}

/* ─── KEYBOARD SHORTCUT  Ctrl+Shift+A ────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    isAdmin() ? exitAdmin() : showLogin();
  }
});

/* ─── INIT ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadEdits();
  if (isAdmin()) {
    renderAdminBar();
    enableEditing();
    document.body.classList.add('admin-active');
  }
  document.getElementById('admin-trigger')?.addEventListener('click', () => {
    isAdmin() ? exitAdmin() : showLogin();
  });
});
