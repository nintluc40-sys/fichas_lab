/**
 * storage.js — LocalStorage persistence layer
 * Handles serializing and deserializing the cards array.
 */

const STORAGE_KEY = 'labtrack_v1';

/**
 * Persist the cards array to localStorage.
 * @param {Array} cards
 * @throws Will throw if storage quota is exceeded.
 */
export function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/**
 * Load the cards array from localStorage.
 * @returns {Array|null} Parsed cards array, or null if nothing is stored.
 * @throws Will throw if stored data is malformed JSON.
 */
export function loadCards() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}
