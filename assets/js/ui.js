/**
 * ui.js — UI rendering module
 *
 * Responsible for all DOM mutations:
 *   - A4 preview grid (filled & empty cards)
 *   - Header badge (card count)
 *   - PDF export modal (open / close)
 *   - Toast notifications
 *
 * No application state is managed here; state lives in app.js.
 */

import { esc } from './utils.js';

/* ── PREVIEW ─────────────────────────────────── */

/**
 * Re-render the 3×3 preview grid.
 * @param {Array}    cards    - Current cards array (0–9 items)
 * @param {Function} onDelete - Callback(index) when a card's × is clicked
 */
export function renderPreview(cards, onDelete) {
  const grid = document.getElementById('preview-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 9; i++) {
    const card = cards[i];
    const el   = document.createElement('div');

    if (card) {
      el.className = 'mini-card';
      el.innerHTML = _buildFilledCard(card);
      // Bind delete button separately (avoids inline onclick + index closure issues)
      el.querySelector('.del-btn').addEventListener('click', () => onDelete(i));
    } else {
      el.className = 'mini-card empty';
      el.innerHTML = `<span class="slot-num">${i + 1}</span><span class="slot-hint">vacío</span>`;
    }

    grid.appendChild(el);
  }
}

function _buildFilledCard(card) {
  const tRows = [1, 2, 3, 4, 5, 6, 7, 8]
    .map(n => `
      <div class="mc-t-row">
        <span class="mc-k">T${n}</span>
        <span class="mc-v">${esc(card['t' + n])}</span>
      </div>`)
    .join('');

  return `
    <button class="del-btn" title="Eliminar esta ficha">×</button>
    <div class="mc-head">
      <div class="mc-line">
        <span class="mc-k">Lab:</span>
        <span class="mc-v">${esc(card.lab)}</span>
      </div>
      <div class="mc-line">
        <span class="mc-k">Fecha:</span>
        <span class="mc-v">${esc(card.fecha)}</span>
      </div>
      <div class="mc-line">
        <span class="mc-k">Carro:</span>
        <span class="mc-v">${esc(card.carro)}</span>
      </div>
    </div>
    <div class="mc-t-grid">${tRows}</div>
    <div class="mc-foot">
      <div class="mc-line">
        <span class="mc-k">C.Fact:</span>
        <span class="mc-v">${esc(card.cfact)}</span>
      </div>
      <div class="mc-line">
        <span class="mc-k">C.Real:</span>
        <span class="mc-v">${esc(card.creal)}</span>
      </div>
      <div class="mc-obs">${esc(card.obs)}</div>
    </div>`;
}

/* ── BADGE ───────────────────────────────────── */

/** Update the header card-count badge. */
export function updateBadge(count) {
  const el = document.getElementById('badge');
  el.textContent = `${count} / 9 fichas`;
  el.classList.toggle('full', count >= 9);
}

/* ── MODAL ───────────────────────────────────── */

/** Show the PDF export modal with the given card count. */
export function openModal(count) {
  document.getElementById('modal-count').textContent = count;
  document.getElementById('modal').classList.remove('hidden');
}

/** Hide the PDF export modal. */
export function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

/* ── TOAST ───────────────────────────────────── */

let _toastTimer = null;

/**
 * Show a toast notification.
 * @param {string} msg  - Message to display
 * @param {string} type - CSS modifier: 'success' | 'error' | '' (neutral)
 */
export function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show${type ? ' ' + type : ''}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
