/**
 * utils.js — Shared utility helpers
 * Pure functions with no side effects or DOM access.
 */

/** Returns today's date as dd/mm/yyyy */
export function todayStr() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Date string formatted for filenames: dd-mm-yyyy */
export function filenameDate() {
  return todayStr().replace(/\//g, '-');
}

/** Escape HTML special characters to prevent XSS */
export function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Truncate text so it fits within maxW mm at the current jsPDF font settings.
 * @param {object} doc   - jsPDF instance (font already set)
 * @param {string} text  - Input text
 * @param {number} maxW  - Maximum width in mm
 * @returns {string}     - Text that fits
 */
export function fitText(doc, text, maxW) {
  if (!text) return '';
  let t = text;
  while (t.length > 0 && doc.getTextWidth(t) > maxW) t = t.slice(0, -1);
  return t;
}
