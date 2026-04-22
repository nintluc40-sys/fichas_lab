/**
 * app.js — Application entry point
 *
 * Owns all application state and wires together the other modules.
 * This is the only file with direct knowledge of the full card array.
 *
 * Modules used:
 *   utils.js   → date / text helpers
 *   storage.js → localStorage read/write
 *   pdf.js     → jsPDF document builder
 *   ui.js      → DOM rendering (preview, toast, modal, badge)
 */

import { todayStr, filenameDate }                      from './utils.js';
import { saveCards, loadCards }                         from './storage.js';
import { buildPDF }                                     from './pdf.js';
import { renderPreview, updateBadge,
         openModal, closeModal, showToast }             from './ui.js';

/* ══════════════════════════════════════════════
   APPLICATION STATE
══════════════════════════════════════════════ */
let cards   = [];     // Array of card objects (max 9)
let pdfBlob = null;   // Cached PDF Blob for modal actions

/* ══════════════════════════════════════════════
   INITIALISATION
══════════════════════════════════════════════ */
(function init() {
  document.getElementById('f-fecha').value = todayStr();
  _refresh();
  _bindEvents();
})();

/* ══════════════════════════════════════════════
   FORM HELPERS
══════════════════════════════════════════════ */

/** Read a trimmed value from a form field by ID. */
const _fv = id => document.getElementById(id).value.trim();

/** Collect all form field values into a plain card object. */
function _readForm() {
  return {
    lab:   _fv('f-lab'),
    fecha: _fv('f-fecha') || todayStr(),
    carro: _fv('f-carro'),
    t1: _fv('f-t1'), t2: _fv('f-t2'), t3: _fv('f-t3'), t4: _fv('f-t4'),
    t5: _fv('f-t5'), t6: _fv('f-t6'), t7: _fv('f-t7'), t8: _fv('f-t8'),
    cfact: _fv('f-cfact'),
    creal: _fv('f-creal'),
    obs:   _fv('f-obs'),
  };
}

/** Clear all editable form inputs and reset the date. */
function _clearForm() {
  const ids = [
    'f-lab', 'f-carro',
    'f-t1', 'f-t2', 'f-t3', 'f-t4',
    'f-t5', 'f-t6', 'f-t7', 'f-t8',
    'f-cfact', 'f-creal', 'f-obs',
  ];
  ids.forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('f-fecha').value = todayStr();
  showToast('Formulario limpiado', 'success');
}

/* ══════════════════════════════════════════════
   CARD MANAGEMENT
══════════════════════════════════════════════ */

function _addCard() {
  if (cards.length >= 9) {
    showToast('⚠ La hoja ya tiene 9 fichas (máximo)', 'error');
    return;
  }
  cards.push(_readForm());
  pdfBlob = null;
  _refresh();
  showToast(`✓ Ficha #${cards.length} guardada en el lote`, 'success');
}

function _deleteCard(index) {
  cards.splice(index, 1);
  pdfBlob = null;
  _refresh();
  showToast('Ficha eliminada del lote', '');
}

function _clearAll() {
  if (!cards.length) { showToast('No hay fichas en el lote', ''); return; }
  if (!confirm(`¿Borrar las ${cards.length} ficha(s) del lote actual?`)) return;
  cards   = [];
  pdfBlob = null;
  _refresh();
  showToast('Lote vaciado', 'success');
}

/** Re-render preview and badge after any state change. */
function _refresh() {
  renderPreview(cards, _deleteCard);
  updateBadge(cards.length);
}

/* ══════════════════════════════════════════════
   PERSISTENCE
══════════════════════════════════════════════ */

function _handleSave() {
  try {
    saveCards(cards);
    showToast(`💾 ${cards.length} ficha(s) guardada(s) localmente`, 'success');
  } catch (err) {
    showToast('Error al guardar: ' + err.message, 'error');
  }
}

function _handleLoad() {
  try {
    const loaded = loadCards();
    if (!loaded) { showToast('No hay datos guardados aún', ''); return; }
    cards   = loaded;
    pdfBlob = null;
    _refresh();
    showToast(`📂 ${cards.length} ficha(s) cargada(s)`, 'success');
  } catch (err) {
    showToast('Error al cargar datos: ' + err.message, 'error');
  }
}

/* ══════════════════════════════════════════════
   PDF — BUILD & EXPORT
══════════════════════════════════════════════ */

function _handleOpenModal() {
  if (!cards.length) {
    showToast('⚠ No hay fichas para exportar', 'error');
    return;
  }
  try {
    pdfBlob = buildPDF(cards).output('blob');
    openModal(cards.length);
  } catch (err) {
    showToast('Error al generar PDF: ' + err.message, 'error');
  }
}

function _doDownload() {
  if (!pdfBlob) return;
  const url = URL.createObjectURL(pdfBlob);
  const a   = Object.assign(document.createElement('a'), {
    href:     url,
    download: `fichas_lab_${filenameDate()}.pdf`,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  closeModal();
  showToast('✓ PDF descargado correctamente', 'success');
}

async function _doWhatsApp() {
  if (!pdfBlob) return;
  const fname = `fichas_lab_${filenameDate()}.pdf`;
  const file  = new File([pdfBlob], fname, { type: 'application/pdf' });

  // ── Mobile path: Web Share API with file attachment ──
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Fichas de Laboratorio',
        text:  `Fichas de cosecha — ${todayStr()}`,
      });
      closeModal();
      showToast('✓ PDF compartido exitosamente', 'success');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled the share sheet
    }
  }

  // ── Desktop fallback: download + open WhatsApp Web ──
  closeModal();
  const url = URL.createObjectURL(pdfBlob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: fname });
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    window.open('https://web.whatsapp.com', '_blank');
    showToast('PDF guardado — adjúntalo en WhatsApp Web', 'success');
  }, 600);
}

/* ══════════════════════════════════════════════
   EVENT BINDING
══════════════════════════════════════════════ */

function _bindEvents() {
  // ── Form & card buttons ──
  document.getElementById('btn-add').addEventListener('click', _addCard);
  document.getElementById('btn-save').addEventListener('click', _handleSave);
  document.getElementById('btn-load').addEventListener('click', _handleLoad);
  document.getElementById('btn-pdf').addEventListener('click', _handleOpenModal);
  document.getElementById('btn-clear').addEventListener('click', _clearForm);
  document.getElementById('btn-clear-all').addEventListener('click', _clearAll);

  // ── Modal ──
  document.getElementById('btn-download').addEventListener('click', _doDownload);
  document.getElementById('btn-wa').addEventListener('click', _doWhatsApp);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  // Close modal when clicking the overlay backdrop
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });

  // ── Keyboard shortcuts ──
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') _addCard();   // Ctrl+Enter → add card
    if (e.key === 'Escape')              closeModal(); // Esc → close modal
  });
}
