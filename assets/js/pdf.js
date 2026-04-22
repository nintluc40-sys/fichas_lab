/**
 * pdf.js — PDF generation module
 *
 * Generates a high-quality A4 PDF with up to 9 lab cards arranged in a 3×3 grid.
 * Uses jsPDF's vector drawing API directly (no html2canvas) for crisp output
 * at any print resolution.
 *
 * Depends on: jsPDF loaded as window.jspdf (CDN global)
 */

import { fitText } from './utils.js';

/* ── PAGE LAYOUT CONSTANTS (mm) ──────────────── */
const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 8;       // page margin on all sides
const COLS    = 3;
const ROWS    = 3;
const GAP_X   = 2;       // horizontal gap between cards
const GAP_Y   = 2;       // vertical gap between cards

// Card dimensions (computed)
const CW = (PAGE_W - 2 * MARGIN - (COLS - 1) * GAP_X) / COLS; // ≈ 63.33 mm
const CH = (PAGE_H - 2 * MARGIN - (ROWS - 1) * GAP_Y) / ROWS; // ≈ 92.33 mm

/* ── CARD LAYOUT CONSTANTS (mm, relative to card origin) ── */
const PAD    = 2;    // inner padding
const FS     = 6;    // base font size (pt)
const FS_SM  = 5.5;  // small font size (pt) for obs text
const T_ROW  = 7;    // height per T-row (mm)

/**
 * Build a jsPDF document from the given cards array.
 * Slots without a card are rendered as empty (slot number only).
 *
 * @param  {Array}  cards - Array of card objects (0–9 items)
 * @returns {object}       jsPDF instance (call .output() to get the PDF)
 */
export function buildPDF(cards) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  for (let i = 0; i < 9; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx  = MARGIN + col * (CW + GAP_X);
    const cy  = MARGIN + row * (CH + GAP_Y);
    _drawCard(doc, cards[i] ?? null, cx, cy, i + 1);
  }

  return doc;
}

/* ── PRIVATE: draw one card ──────────────────── */

function _drawCard(doc, card, cx, cy, slotNum) {
  // Outer border
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.4);
  doc.rect(cx, cy, CW, CH);

  // Empty slot
  if (!card) {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(String(slotNum), cx + CW / 2, cy + CH / 2, {
      align: 'center',
      baseline: 'middle',
    });
    _resetColors(doc);
    return;
  }

  doc.setTextColor(0, 0, 0);

  let y = cy + PAD; // running Y cursor

  // ── 1. HEADER ───────────────────────────────
  y = _drawHeader(doc, card, cx, cy, y);

  // Separator under header
  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 0, 0);
  doc.line(cx, y, cx + CW, y);

  // ── 2. T1–T8 ROWS ───────────────────────────
  for (let i = 1; i <= 8; i++) {
    const ry  = y + (i - 1) * T_ROW;
    const val = card['t' + i] || '';

    doc.setFontSize(FS);
    doc.setFont('helvetica', 'bold');
    doc.text(`T${i}`, cx + PAD, ry + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(val, cx + PAD + 7, ry + 4);

    // Light separator between rows
    doc.setLineWidth(0.12);
    doc.setDrawColor(185, 185, 185);
    doc.line(cx, ry + T_ROW, cx + CW, ry + T_ROW);
  }

  // Restore after T-rows
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  y = y + 8 * T_ROW;

  // ── 3. C.FACT ───────────────────────────────
  doc.setFontSize(FS);
  doc.setFont('helvetica', 'bold');
  doc.text('C.Fact:', cx + PAD, y + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.text(card.cfact || '', cx + PAD + 14, y + 3.8);
  y += 5.5;
  doc.line(cx, y, cx + CW, y);

  // ── 4. C. REAL ──────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.text('C. Real:', cx + PAD, y + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.text(card.creal || '', cx + PAD + 15, y + 3.8);
  y += 5.5;
  doc.line(cx, y, cx + CW, y);

  // ── 5. OBSERVACIONES ────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.text('Obs.:', cx + PAD, y + 3.8);

  if (card.obs) {
    doc.setFontSize(FS_SM);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(card.obs, CW - PAD * 2);
    doc.text(wrapped.slice(0, 2), cx + PAD, y + 7.5);
  }

  _resetColors(doc);
}

function _drawHeader(doc, card, cx, cy, y) {
  // Row 1 — Lab
  y += 3.5;
  doc.setFontSize(FS);
  doc.setFont('helvetica', 'bold');
  doc.text('Lab:', cx + PAD, y);
  doc.setFont('helvetica', 'normal');
  doc.text(fitText(doc, card.lab, CW - PAD * 2 - 8), cx + PAD + 8, y);

  // Row 2 — Fecha (left) + Carro (right)
  y += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', cx + PAD, y);
  doc.setFont('helvetica', 'normal');
  doc.text(card.fecha || '', cx + PAD + 11, y);

  // Carro right-aligned
  const carroLabel = 'Carro:';
  const carroVal   = card.carro || '';
  const labelW     = doc.getTextWidth(carroLabel);
  const valW       = doc.getTextWidth(carroVal);
  const rx         = cx + CW - PAD - valW;
  doc.setFont('helvetica', 'bold');
  doc.text(carroLabel, rx - labelW - 1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(carroVal, rx, y);

  // Return Y position for separator line
  y += 2.2;
  return y;
}

function _resetColors(doc) {
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
}
