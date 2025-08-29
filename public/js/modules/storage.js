// Local storage management

import { state, updateState } from './state.js';

export function loadReadItems() {
  try {
    const stored = localStorage.getItem('readItems');
    if (stored) {
      updateState({ readItems: new Set(JSON.parse(stored)) });
    }
  } catch (e) {
    console.warn('Could not load read items:', e);
    updateState({ readItems: new Set() });
  }
}

export function saveReadItems() {
  try {
    localStorage.setItem('readItems', JSON.stringify([...state.readItems]));
  } catch (e) {
    console.warn('Could not save read items:', e);
  }
}