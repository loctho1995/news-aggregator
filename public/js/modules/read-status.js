// Read status management

import { state } from './state.js';
import { saveReadItems } from './storage.js';
import { elements } from './elements.js';

export function isRead(url) {
  return state.readItems.has(url);
}

export function markRead(url) {
  if (state.readItems.has(url)) return;
  
  state.readItems.add(url);
  saveReadItems();
  
  const card = document.querySelector(`[data-url="${CSS.escape(url)}"]`);
  if (card) {
    card.classList.add("opacity-60", "read");
    
    const readStatusBtn = card.querySelector('.read-status-btn');
    if (readStatusBtn) {
      readStatusBtn.innerHTML = '✅ Đã đọc';
      readStatusBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
      readStatusBtn.classList.add('bg-green-600', 'hover:bg-green-500');
    }
    
    elements.grid.appendChild(card);
  }
}

export function toggleReadStatus(url) {
  if (state.readItems.has(url)) {
    // Mark as unread
    state.readItems.delete(url);
    saveReadItems();
    
    const card = document.querySelector(`[data-url="${CSS.escape(url)}"]`);
    if (card) {
      card.classList.remove("opacity-60", "read");
      
      const readStatusBtn = card.querySelector('.read-status-btn');
      if (readStatusBtn) {
        readStatusBtn.innerHTML = '⚪ Chưa đọc';
        readStatusBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
        readStatusBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
      }
      
      const firstReadCard = elements.grid.querySelector('.read');
      if (firstReadCard && firstReadCard !== card) {
        elements.grid.insertBefore(card, firstReadCard);
      } else {
        elements.grid.insertBefore(card, elements.grid.firstChild);
      }
    }
  } else {
    markRead(url);
  }
}
