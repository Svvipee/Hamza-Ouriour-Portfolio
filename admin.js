'use strict';

/* ═══════════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════════ */
const _AU = 'svvipee';
const _AP = 'svvipee';
const SK  = 'hamza_pf_v3';   // localStorage key
const SE  = 'hamza_sess_v3'; // sessionStorage key

/* ═══════════════════════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════════════════════ */
const Store = {
  get()       { try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch { return {}; } },
  set(d)      { localStorage.setItem(SK, JSON.stringify(d)); },
  patch(p)    { this.set({ ...this.get(), ...p }); },
  clear()     { localStorage.removeItem(SK); },
};

/* ═══════════════════════════════════════════════════════════════
   SESSION
═══════════════════════════════════════════════════════════════ */
const isAdmin = () => sessionStorage.getItem(SE) === '1';

function enterAdmin() {
  sessionStorage.setItem(SE, '1');
  document.body.classList.add('admin-mode');
  renderAdminBar();
  enableEditing();
  renderAddProjectBtn();
}

function exitAdmin() {
  sessionStorage.removeItem(SE);
  document.body.classList.remove('admin-mode');
  document.getElementById('adm-bar')?.remove();
  document.getElementById('adm-add-proj')?.remove();
  disableEditing();
}

/* ═══════════════════════════════════════════════════════════════
   INJECT STYLES
═══════════════════════════════════════════════════════════════ */
(function injectCSS() {
  const s = document.createElement('style');
  s.id = 'admin-css';
  s.textContent = `
/* ── Admin bar ────────────────────────────────── */
#adm-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9100;
  height: 38px; background: rgba(8,8,8,0.97);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  display: flex; align-items: center; padding: 0 1.5rem;
  font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
#adm-bar-inner {
  max-width: 1080px; width: 100%; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
#adm-label {
  font-size: 0.67rem; color: #484848; letter-spacing: 0.15em;
  text-transform: uppercase; user-select: none;
  display: flex; align-items: center; gap: 7px;
}
#adm-label-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #fff; box-shadow: 0 0 6px rgba(255,255,255,0.7); flex-shrink: 0;
}
#adm-actions { display: flex; gap: 5px; align-items: center; }

.adm-pill {
  font-size: 0.67rem; padding: 0.2rem 0.65rem; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #777;
  cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
  font-family: inherit; line-height: 1.5;
}
.adm-pill:hover       { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.22); color: #ccc; }
.adm-pill--hi         { border-color: rgba(255,255,255,0.22); color: #bbb; }
.adm-pill--hi:hover   { background: rgba(255,255,255,0.09); color: #fff; border-color: rgba(255,255,255,0.4); }

body.admin-mode { padding-top: 38px; }

/* ── Editable field outlines ──────────────────── */
.admin-mode [data-editable][contenteditable="true"] {
  outline: 1px dashed rgba(255,255,255,0.11);
  border-radius: 4px; cursor: text; transition: outline-color 0.15s, background 0.15s;
}
.admin-mode [data-editable][contenteditable="true"]:hover {
  outline-color: rgba(255,255,255,0.26); background: rgba(255,255,255,0.02);
}
.admin-mode [data-editable][contenteditable="true"]:focus {
  outline: 1px solid rgba(255,255,255,0.44); background: rgba(255,255,255,0.025);
}

/* ── Add-project button ───────────────────────── */
#adm-add-proj {
  border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;
  min-height: 90px; display: flex; align-items: center; justify-content: center;
  gap: 0.4rem; cursor: pointer; color: #444; font-size: 0.78rem;
  letter-spacing: 0.04em; transition: border-color 0.2s, color 0.2s, background 0.2s;
  font-family: system-ui,-apple-system,sans-serif;
}
#adm-add-proj:hover { border-color: rgba(255,255,255,0.28); color: #999; background: rgba(255,255,255,0.02); }

/* ── Card image thumbnail ─────────────────────── */
.proj-card-img {
  border-radius: 10px; overflow: hidden; margin-bottom: 0.65rem;
  border: 1px solid rgba(255,255,255,0.07); max-height: 110px; background: #111;
}
.proj-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── View-details trigger ─────────────────────── */
.view-details-btn {
  font-size: 0.67rem; color: #484848; cursor: pointer; background: none;
  border: none; padding: 0; font-family: inherit; letter-spacing: 0.04em;
  display: inline-flex; align-items: center; gap: 3px; transition: color 0.15s;
}
.view-details-btn:hover { color: #aaa; }
.view-details-btn svg { transition: transform 0.15s; }
.view-details-btn:hover svg { transform: translateX(2px); }

/* ── Admin trigger (footer dot) ───────────────── */
#admin-trigger {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: transparent; cursor: pointer; opacity: 0;
  transition: opacity 0.3s, background 0.3s;
  vertical-align: middle; margin-left: 6px;
}
#admin-trigger:hover { opacity: 0.3; background: #fff; }

/* ═══════════════════════════════════════════════
   LOGIN MODAL
═══════════════════════════════════════════════ */
#adm-login-overlay {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  animation: admFadeIn 0.2s ease;
}
.adm-overlay-bg {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
}
.adm-login-card {
  position: relative; z-index: 1;
  background: #0c0c0c; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px; padding: 2rem 1.8rem;
  width: 100%; max-width: 308px;
  box-shadow: 0 40px 80px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.03);
  animation: admSlideUp 0.3s cubic-bezier(0.16,1,0.3,1);
}
@keyframes admFadeIn  { from { opacity: 0; }                 to { opacity: 1; } }
@keyframes admSlideUp { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }

.adm-login-orb {
  width: 30px; height: 30px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff 0%, #444 100%);
  margin-bottom: 1.2rem;
}
.adm-login-heading { font-size: 1rem; font-weight: 600; color: #f0f0f0; margin-bottom: 0.2rem; }
.adm-login-sub     { font-size: 0.73rem; color: #484848; margin-bottom: 1.4rem; }

.adm-field + .adm-field { margin-top: 0.65rem; }
.adm-field-label {
  display: block; font-size: 0.63rem; text-transform: uppercase;
  letter-spacing: 0.12em; color: #484848; margin-bottom: 0.3rem;
}
.adm-text-input {
  width: 100%; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
  color: #f0f0f0; padding: 0.52rem 0.75rem; font-size: 0.83rem;
  outline: none; transition: border-color 0.15s, background 0.15s; font-family: inherit;
}
.adm-text-input:focus    { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.04); }
.adm-text-input.is-error { border-color: rgba(220,80,80,0.4); }
.adm-login-err  { font-size: 0.68rem; color: #8a3a3a; min-height: 1rem; margin-top: 0.4rem; }

.adm-login-footer { display: flex; gap: 0.5rem; align-items: center; margin-top: 1.4rem; }
.adm-login-submit {
  flex: 1; padding: 0.52rem; border-radius: 999px;
  background: #fff; color: #080808; border: none;
  font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: opacity 0.15s;
}
.adm-login-submit:hover { opacity: 0.88; }
.adm-login-cancel {
  padding: 0.52rem 1rem; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.1); background: transparent;
  color: #555; font-size: 0.78rem; cursor: pointer; font-family: inherit;
  transition: border-color 0.15s, color 0.15s;
}
.adm-login-cancel:hover { border-color: rgba(255,255,255,0.2); color: #888; }

/* ═══════════════════════════════════════════════
   PROJECT DETAIL MODAL
═══════════════════════════════════════════════ */
#proj-detail-modal {
  position: fixed; inset: 0; z-index: 9500;
  display: flex; align-items: flex-end;
  font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
@media (min-width: 680px) { #proj-detail-modal { align-items: center; } }

.pdm-bg {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.82); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
}
.pdm-sheet {
  position: relative; z-index: 1; background: #0c0c0c;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px 24px 0 0; width: 100%;
  max-width: 720px; margin: 0 auto;
  max-height: 92vh; display: flex; flex-direction: column;
  box-shadow: 0 -24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03);
  animation: pdmUp 0.36s cubic-bezier(0.16,1,0.3,1);
  overflow: hidden;
}
@media (min-width: 680px) {
  .pdm-sheet { border-radius: 24px; animation: pdmScale 0.3s cubic-bezier(0.16,1,0.3,1); }
}
@keyframes pdmUp    { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes pdmScale { from { transform: scale(0.97); opacity: 0; } to { transform: none; opacity: 1; } }

/* drag handle on mobile */
.pdm-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,0.12); margin: 10px auto 0; flex-shrink: 0;
}
@media (min-width: 680px) { .pdm-handle { display: none; } }

.pdm-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.4rem 0; flex-shrink: 0;
}
.pdm-type {
  font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.13em;
  color: #484848; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 999px; padding: 0.13rem 0.55rem; background: rgba(255,255,255,0.03);
}
.pdm-close {
  width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: #777; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; transition: background 0.15s, color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.pdm-close:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.22); }

.pdm-scroll { overflow-y: auto; flex: 1; }

.pdm-hero-img {
  margin: 1rem 1.4rem 0; border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.07); max-height: 200px;
}
.pdm-hero-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

.pdm-body { padding: 1.1rem 1.4rem; }
.pdm-pill  { font-size: 0.65rem; color: #555; margin-bottom: 0.35rem; }
.pdm-title { font-size: 1.25rem; font-weight: 700; color: #f5f5f5; margin-bottom: 0.6rem; line-height: 1.3; }
.pdm-tags  { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 1rem; }
.pdm-tag   {
  font-size: 0.62rem; padding: 0.12rem 0.4rem; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08); color: #666; background: rgba(255,255,255,0.02);
}
.pdm-content {
  font-size: 0.84rem; color: #8a8a8a; line-height: 1.75; min-height: 40px;
}
.pdm-content:focus { outline: none; }
.pdm-content p  { margin-bottom: 0.75rem; }
.pdm-content ul { padding-left: 1.1rem; margin-bottom: 0.75rem; }
.pdm-content li { margin-bottom: 0.35rem; }
.pdm-content h4 {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em;
  color: #444; margin: 1.1rem 0 0.45rem;
}
.pdm-content strong { color: #b5b5b5; font-weight: 600; }

/* Admin media controls inside modal */
.pdm-admin-zone {
  margin: 0 1.4rem 0.75rem;
  border: 1px dashed rgba(255,255,255,0.09); border-radius: 14px;
  padding: 0.9rem 1rem; background: rgba(255,255,255,0.015);
  display: flex; flex-direction: column; gap: 0.55rem;
}
.pdm-admin-zone-label {
  font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.12em; color: #444; margin-bottom: 0.1rem;
}
.pdm-media-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.pdm-media-key { font-size: 0.63rem; color: #484848; width: 44px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.08em; }
.pdm-media-input {
  flex: 1; min-width: 100px; background: transparent;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  color: #ccc; padding: 0.3rem 0.55rem; font-size: 0.71rem;
  outline: none; transition: border-color 0.15s; font-family: inherit;
}
.pdm-media-input:focus { border-color: rgba(255,255,255,0.25); }
.pdm-upload-label {
  font-size: 0.63rem; padding: 0.26rem 0.6rem; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.1); background: transparent;
  color: #666; cursor: pointer; white-space: nowrap; transition: 0.15s;
  font-family: inherit;
}
.pdm-upload-label:hover { border-color: rgba(255,255,255,0.22); color: #aaa; }
.pdm-save-btn {
  font-size: 0.68rem; padding: 0.28rem 0.8rem; border-radius: 999px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14);
  color: #bbb; cursor: pointer; transition: 0.15s; align-self: flex-end; font-family: inherit;
}
.pdm-save-btn:hover { background: rgba(255,255,255,0.13); color: #fff; }

.pdm-footer {
  padding: 0 1.4rem 1.4rem; display: flex; flex-wrap: wrap; gap: 0.45rem; flex-shrink: 0;
}
.pdm-link {
  font-size: 0.7rem; padding: 0.28rem 0.8rem; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12); color: #999; background: transparent;
  text-decoration: none; display: inline-block; transition: 0.15s; cursor: pointer;
}
.pdm-link:hover { border-color: rgba(255,255,255,0.3); color: #fff; background: rgba(255,255,255,0.06); }
.pdm-link--primary {
  background: #fff; color: #080808; border-color: #fff; font-weight: 600;
}
.pdm-link--primary:hover { opacity: 0.88; background: #fff; }

/* ═══════════════════════════════════════════════
   ADD PROJECT FORM MODAL
═══════════════════════════════════════════════ */
#adm-add-form {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  animation: admFadeIn 0.2s ease;
}
.adm-form-bg { position: absolute; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(14px); }
.adm-form-card {
  position: relative; z-index: 1; background: #0c0c0c;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 22px;
  padding: 1.6rem 1.5rem; width: 100%; max-width: 500px;
  max-height: 88vh; overflow-y: auto;
  box-shadow: 0 40px 80px rgba(0,0,0,0.95);
  animation: admSlideUp 0.3s cubic-bezier(0.16,1,0.3,1);
}
.adm-form-heading { font-size: 0.92rem; font-weight: 600; color: #f0f0f0; margin-bottom: 1.1rem; }
.adm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
@media (max-width: 480px) { .adm-form-grid { grid-template-columns: 1fr; } }
.adm-form-field { display: flex; flex-direction: column; gap: 0.22rem; }
.adm-form-field.full { grid-column: 1 / -1; }
.adm-form-label { font-size: 0.62rem; color: #484848; text-transform: uppercase; letter-spacing: 0.1em; }
.adm-form-input, .adm-form-select, .adm-form-textarea {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px; color: #f0f0f0; padding: 0.44rem 0.65rem;
  font-size: 0.8rem; outline: none; font-family: inherit;
  transition: border-color 0.15s, background 0.15s;
}
.adm-form-input:focus, .adm-form-select:focus, .adm-form-textarea:focus {
  border-color: rgba(255,255,255,0.26); background: rgba(255,255,255,0.04);
}
.adm-form-select option { background: #111; }
.adm-form-textarea { resize: vertical; min-height: 64px; }
.adm-form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.1rem; }
.adm-form-submit {
  padding: 0.48rem 1.1rem; border-radius: 999px;
  background: #fff; color: #080808; border: none;
  font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s;
}
.adm-form-submit:hover { opacity: 0.88; }
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════
   LOAD / SAVE
═══════════════════════════════════════════════════════════════ */
function loadAll() {
  const s = Store.get();

  // Text edits
  Object.entries(s.text || {}).forEach(([k, v]) => {
    const el = document.querySelector(`[data-editable="${k}"]`);
    if (el) el.innerHTML = v;
  });

  // Project card images
  Object.entries(s.media || {}).forEach(([pid, m]) => {
    if (m.imgSrc) injectCardImage(pid, m.imgSrc);
  });

  // Custom projects
  (s.customProjects || []).forEach(p => renderCustomCard(p));

  // Deleted projects
  (s.deletedProjects || []).forEach(id => {
    document.querySelector(`[data-project-id="${id}"]`)?.remove();
  });
}

function saveText() {
  const text = {};
  document.querySelectorAll('[data-editable]').forEach(el => {
    text[el.dataset.editable] = el.innerHTML;
  });
  Store.patch({ text });
  const btn = document.getElementById('adm-save-btn');
  if (btn) { btn.textContent = 'Saved ✓'; setTimeout(() => { btn.textContent = 'Save'; }, 2200); }
}

function resetAll() {
  if (!confirm('Clear all saved edits and restore original content?')) return;
  Store.clear();
  location.reload();
}

/* ═══════════════════════════════════════════════════════════════
   EDITING
═══════════════════════════════════════════════════════════════ */
function enableEditing() {
  document.querySelectorAll('[data-editable]').forEach(el => { el.contentEditable = 'true'; });
}
function disableEditing() {
  document.querySelectorAll('[data-editable]').forEach(el => { el.contentEditable = 'false'; });
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN BAR
═══════════════════════════════════════════════════════════════ */
function renderAdminBar() {
  if (document.getElementById('adm-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'adm-bar';
  bar.innerHTML = `
    <div id="adm-bar-inner">
      <div id="adm-label"><div id="adm-label-dot"></div> Admin — click any field to edit</div>
      <div id="adm-actions">
        <button id="adm-save-btn"  class="adm-pill adm-pill--hi">Save</button>
        <button id="adm-reset-btn" class="adm-pill">Reset</button>
        <button id="adm-exit-btn"  class="adm-pill">Exit</button>
      </div>
    </div>`;
  document.body.prepend(bar);
  document.getElementById('adm-save-btn').onclick  = saveText;
  document.getElementById('adm-reset-btn').onclick = resetAll;
  document.getElementById('adm-exit-btn').onclick  = exitAdmin;
}

/* ═══════════════════════════════════════════════════════════════
   ADD PROJECT BUTTON (admin mode)
═══════════════════════════════════════════════════════════════ */
function renderAddProjectBtn() {
  if (document.getElementById('adm-add-proj')) return;
  const btn = document.createElement('div');
  btn.id = 'adm-add-proj';
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg> Add Project`;
  btn.onclick = showAddForm;
  document.querySelector('.projects-grid')?.appendChild(btn);
}

/* ═══════════════════════════════════════════════════════════════
   CARD HELPERS
═══════════════════════════════════════════════════════════════ */
function injectCardImage(pid, imgSrc) {
  const card = document.querySelector(`[data-project-id="${pid}"]`);
  if (!card) return;
  const ex = card.querySelector('.proj-card-img');
  if (ex) { ex.querySelector('img').src = imgSrc; return; }
  const d = document.createElement('div');
  d.className = 'proj-card-img';
  d.innerHTML = `<img src="${imgSrc}" alt="" loading="lazy" />`;
  card.prepend(d);
}

function renderCustomCard(proj) {
  if (document.querySelector(`[data-project-id="${proj.id}"]`)) return;
  const art = document.createElement('article');
  art.className = 'project-card';
  art.dataset.projectId = proj.id;
  art.dataset.tags = proj.tags || 'soft';
  art.innerHTML = `
    <div class="project-chip-row">
      <div class="project-type" data-editable="${proj.id}-type">${proj.type || 'Project'}</div>
      <div class="project-pill" data-editable="${proj.id}-pill">${proj.pill || ''}</div>
    </div>
    <h3 class="project-title" data-editable="${proj.id}-title">${proj.title}</h3>
    <p class="project-subtitle" data-editable="${proj.id}-sub">${proj.subtitle || ''}</p>
    <div class="project-meta">${(proj.meta || []).map(m => `<span>${m}</span>`).join('')}</div>
    <div class="project-footer">
      <button class="view-details-btn" data-action="view-details">
        View details
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 5h8M5 1l4 4-4 4"/></svg>
      </button>
      <div class="project-links">
        ${proj.github ? `<a href="${proj.github}" target="_blank">GitHub</a>` : ''}
        ${proj.link   ? `<a href="${proj.link}"   target="_blank">${proj.linkLabel||'Link'}</a>` : ''}
      </div>
    </div>
    <template class="proj-detail-default"><p>${proj.detail || proj.subtitle || ''}</p></template>`;
  const grid = document.querySelector('.projects-grid');
  const addBtn = document.getElementById('adm-add-proj');
  if (grid) grid.insertBefore(art, addBtn || null);
  art.querySelector('[data-action="view-details"]').addEventListener('click', () => openDetailModal(proj.id));
  if (proj.imgSrc) injectCardImage(proj.id, proj.imgSrc);
  if (isAdmin()) {
    art.querySelectorAll('[data-editable]').forEach(el => { el.contentEditable = 'true'; });
  }
}

/* ═══════════════════════════════════════════════════════════════
   PROJECT DETAIL MODAL
═══════════════════════════════════════════════════════════════ */
function openDetailModal(pid) {
  if (document.getElementById('proj-detail-modal')) return;

  const card = document.querySelector(`[data-project-id="${pid}"]`);
  if (!card) return;

  const s = Store.get();
  const media      = (s.media  || {})[pid] || {};
  const detailHtml = (s.detail || {})[pid]
    || card.querySelector('template.proj-detail-default')?.innerHTML
    || `<p>${card.querySelector('.project-subtitle')?.textContent?.trim() || ''}</p>`;

  const type    = card.querySelector('.project-type')?.textContent || '';
  const pill    = card.querySelector('.project-pill')?.textContent || '';
  const title   = card.querySelector('.project-title')?.textContent || '';
  const metaTags= [...card.querySelectorAll('.project-meta span')].map(s => s.textContent);
  const cardLinks=[...card.querySelectorAll('.project-links a')].map(a => ({ text: a.textContent.trim(), href: a.href }));

  const m = document.createElement('div');
  m.id = 'proj-detail-modal';
  m.innerHTML = `
    <div class="pdm-bg"  id="pdm-bg"></div>
    <div class="pdm-sheet" id="pdm-sheet">
      <div class="pdm-handle"></div>
      <div class="pdm-header">
        <span class="pdm-type">${type}</span>
        <button class="pdm-close" id="pdm-close">✕</button>
      </div>
      <div class="pdm-scroll">
        ${media.imgSrc ? `<div class="pdm-hero-img"><img src="${media.imgSrc}" alt="${title}" loading="lazy"/></div>` : '<div id="pdm-img-slot"></div>'}
        <div class="pdm-body">
          <div class="pdm-pill">${pill}</div>
          <div class="pdm-title">${title}</div>
          <div class="pdm-tags">${metaTags.map(t=>`<span class="pdm-tag">${t}</span>`).join('')}</div>
          <div class="pdm-content" id="pdm-content" ${isAdmin()?'contenteditable="true"':''}>${detailHtml}</div>
        </div>
        ${isAdmin() ? `
        <div class="pdm-admin-zone" id="pdm-admin-zone">
          <div class="pdm-admin-zone-label">Admin — media &amp; content</div>
          <div class="pdm-media-row">
            <span class="pdm-media-key">Image</span>
            <input class="pdm-media-input" id="pdm-img-url" placeholder="Paste image URL…" value="${media.imgSrc && !media.imgSrc.startsWith('data:') ? media.imgSrc : ''}" />
            <label class="pdm-upload-label">Upload<input type="file" accept="image/*" id="pdm-img-file" style="display:none"/></label>
          </div>
          <div class="pdm-media-row">
            <span class="pdm-media-key">PDF</span>
            <input class="pdm-media-input" id="pdm-pdf-url" placeholder="Paste PDF or link URL…" value="${media.pdfUrl||''}" />
          </div>
          <button class="pdm-save-btn" id="pdm-save">Save changes</button>
        </div>` : ''}
      </div>
      <div class="pdm-footer" id="pdm-footer">
        ${cardLinks.map(l=>`<a class="pdm-link" href="${l.href}" target="_blank">${l.text}</a>`).join('')}
        ${media.pdfUrl ? `<a class="pdm-link" href="${media.pdfUrl}" target="_blank">View PDF ↗</a>` : ''}
      </div>
    </div>`;

  document.body.appendChild(m);
  document.body.style.overflow = 'hidden';

  const close = () => { m.remove(); document.body.style.overflow = ''; };
  document.getElementById('pdm-close').addEventListener('click', close);
  document.getElementById('pdm-bg').addEventListener('click', close);
  const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
  document.addEventListener('keydown', escH);

  if (isAdmin()) {
    // Image file upload
    document.getElementById('pdm-img-file')?.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('pdm-img-url').value = ev.target.result;
        let slot = m.querySelector('.pdm-hero-img') || document.getElementById('pdm-img-slot');
        if (slot.id === 'pdm-img-slot') {
          slot.outerHTML = `<div class="pdm-hero-img"><img src="${ev.target.result}" alt="" /></div>`;
        } else { slot.querySelector('img').src = ev.target.result; }
      };
      reader.readAsDataURL(file);
    });

    // Save button
    document.getElementById('pdm-save')?.addEventListener('click', () => {
      const content = document.getElementById('pdm-content')?.innerHTML || '';
      const imgSrc  = document.getElementById('pdm-img-url')?.value.trim() || '';
      const pdfUrl  = document.getElementById('pdm-pdf-url')?.value.trim() || '';

      const s2 = Store.get();
      const detail = s2.detail || {}; detail[pid] = content;
      const media2 = s2.media  || {}; media2[pid] = { imgSrc, pdfUrl };
      Store.set({ ...s2, detail, media: media2 });

      if (imgSrc) injectCardImage(pid, imgSrc);

      // Update PDF link in footer
      const footer = document.getElementById('pdm-footer');
      if (pdfUrl && footer && !footer.querySelector('.pdm-pdf-link')) {
        const a = document.createElement('a');
        a.className = 'pdm-link pdm-pdf-link';
        a.href = pdfUrl; a.target = '_blank'; a.textContent = 'View PDF ↗';
        footer.appendChild(a);
      }

      const btn = document.getElementById('pdm-save');
      if (btn) { btn.textContent = 'Saved ✓'; setTimeout(() => { btn.textContent = 'Save changes'; }, 2200); }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   ADD PROJECT FORM
═══════════════════════════════════════════════════════════════ */
function showAddForm() {
  if (document.getElementById('adm-add-form')) return;
  const fm = document.createElement('div');
  fm.id = 'adm-add-form';
  fm.innerHTML = `
    <div class="adm-form-bg" id="adm-form-bg"></div>
    <div class="adm-form-card">
      <div class="adm-form-heading">Add New Project</div>
      <div class="adm-form-grid">
        <div class="adm-form-field full">
          <label class="adm-form-label">Title *</label>
          <input class="adm-form-input" id="pf-title" placeholder="Project title" />
        </div>
        <div class="adm-form-field">
          <label class="adm-form-label">Category</label>
          <input class="adm-form-input" id="pf-type" placeholder="e.g. Software" />
        </div>
        <div class="adm-form-field">
          <label class="adm-form-label">Pill label</label>
          <input class="adm-form-input" id="pf-pill" placeholder="e.g. Python · ROS" />
        </div>
        <div class="adm-form-field">
          <label class="adm-form-label">Section</label>
          <select class="adm-form-select" id="pf-tags">
            <option value="soft">Software</option>
            <option value="mech">Mechanical</option>
            <option value="mech soft">Both</option>
          </select>
        </div>
        <div class="adm-form-field">
          <label class="adm-form-label">Tech stack (comma-sep)</label>
          <input class="adm-form-input" id="pf-meta" placeholder="Python, ROS, MATLAB" />
        </div>
        <div class="adm-form-field full">
          <label class="adm-form-label">Short description (card)</label>
          <textarea class="adm-form-textarea" id="pf-sub"></textarea>
        </div>
        <div class="adm-form-field full">
          <label class="adm-form-label">Full description (detail view)</label>
          <textarea class="adm-form-textarea" id="pf-detail" rows="5" placeholder="Technical writeup, bullet points, etc."></textarea>
        </div>
        <div class="adm-form-field">
          <label class="adm-form-label">GitHub URL</label>
          <input class="adm-form-input" id="pf-github" placeholder="https://github.com/…" />
        </div>
        <div class="adm-form-field">
          <label class="adm-form-label">Demo / PDF URL</label>
          <input class="adm-form-input" id="pf-link" placeholder="https://…" />
        </div>
        <div class="adm-form-field full">
          <label class="adm-form-label">Image URL (optional)</label>
          <input class="adm-form-input" id="pf-img" placeholder="https://…" />
        </div>
      </div>
      <div class="adm-form-actions">
        <button class="adm-pill" id="pf-cancel">Cancel</button>
        <button class="adm-form-submit" id="pf-submit">Add Project</button>
      </div>
    </div>`;
  document.body.appendChild(fm);

  document.getElementById('adm-form-bg').onclick = () => fm.remove();
  document.getElementById('pf-cancel').onclick   = () => fm.remove();
  document.getElementById('pf-submit').onclick   = () => {
    const title = document.getElementById('pf-title').value.trim();
    if (!title) { document.getElementById('pf-title').focus(); return; }

    const meta = document.getElementById('pf-meta').value.split(',').map(x=>x.trim()).filter(Boolean);
    const proj = {
      id:       'custom-' + Date.now(),
      title,
      type:     document.getElementById('pf-type').value.trim() || 'Project',
      pill:     document.getElementById('pf-pill').value.trim(),
      tags:     document.getElementById('pf-tags').value,
      meta,
      subtitle: document.getElementById('pf-sub').value.trim(),
      detail:   document.getElementById('pf-detail').value.trim(),
      github:   document.getElementById('pf-github').value.trim(),
      link:     document.getElementById('pf-link').value.trim(),
      imgSrc:   document.getElementById('pf-img').value.trim(),
    };

    renderCustomCard(proj);

    const s = Store.get();
    const cp = s.customProjects || []; cp.push(proj);
    const media = s.media || {};
    if (proj.imgSrc) media[proj.id] = { imgSrc: proj.imgSrc, pdfUrl: proj.link || '' };
    Store.set({ ...s, customProjects: cp, media });

    fm.remove();
  };
  setTimeout(() => document.getElementById('pf-title')?.focus(), 40);
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════════ */
function showLogin() {
  if (document.getElementById('adm-login-overlay')) return;
  const m = document.createElement('div');
  m.id = 'adm-login-overlay';
  m.innerHTML = `
    <div class="adm-overlay-bg" id="adm-login-bg"></div>
    <div class="adm-login-card">
      <div class="adm-login-orb"></div>
      <div class="adm-login-heading">Admin Access</div>
      <div class="adm-login-sub">Enter credentials to edit this portfolio</div>
      <div class="adm-field">
        <label class="adm-field-label">Username</label>
        <input class="adm-text-input" id="adm-u" type="text" autocomplete="off" spellcheck="false" placeholder="username" />
      </div>
      <div class="adm-field">
        <label class="adm-field-label">Password</label>
        <input class="adm-text-input" id="adm-p" type="password" placeholder="password" />
      </div>
      <div class="adm-login-err" id="adm-err"></div>
      <div class="adm-login-footer">
        <button class="adm-login-cancel" id="adm-cancel">Cancel</button>
        <button class="adm-login-submit" id="adm-go">Sign in</button>
      </div>
    </div>`;
  document.body.appendChild(m);

  const close = () => m.remove();
  document.getElementById('adm-login-bg').onclick = close;
  document.getElementById('adm-cancel').onclick   = close;
  document.getElementById('adm-go').onclick       = tryLogin;
  document.getElementById('adm-u').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('adm-p').focus(); });
  document.getElementById('adm-p').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
  document.addEventListener('keydown', escH);
  setTimeout(() => document.getElementById('adm-u')?.focus(), 40);
}

function tryLogin() {
  const u = document.getElementById('adm-u')?.value.trim();
  const p = document.getElementById('adm-p')?.value;
  if (u === _AU && p === _AP) {
    document.getElementById('adm-login-overlay')?.remove();
    enterAdmin();
  } else {
    const err = document.getElementById('adm-err');
    if (err) err.textContent = 'Invalid username or password.';
    ['adm-u','adm-p'].forEach(id => document.getElementById(id)?.classList.add('is-error'));
    const pi = document.getElementById('adm-p');
    if (pi) { pi.value = ''; pi.focus(); }
  }
}

/* ═══════════════════════════════════════════════════════════════
   KEYBOARD  Ctrl+Shift+A
═══════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    isAdmin() ? exitAdmin() : showLogin();
  }
});

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadAll();

  if (isAdmin()) {
    renderAdminBar();
    enableEditing();
    renderAddProjectBtn();
    document.body.classList.add('admin-mode');
  }

  // Wire all "View details" buttons
  document.querySelectorAll('[data-action="view-details"]').forEach(btn => {
    const card = btn.closest('[data-project-id]');
    if (card) btn.addEventListener('click', () => openDetailModal(card.dataset.projectId));
  });

  // Hidden admin dot in footer
  document.getElementById('admin-trigger')?.addEventListener('click', () => {
    isAdmin() ? exitAdmin() : showLogin();
  });
});
