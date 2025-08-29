// Grid rendering and management

import { elements } from './elements.js';
import { state } from './state.js';
import { itemPassesFilters } from './utils.js';
import { createCardElement } from './card-renderer.js';
import { isRead } from './read-status.js';

export function addItemToGrid(item) {
  if (!itemPassesFilters(item, state.currentFilters)) return;
  
  if (!elements.empty.classList.contains("hidden")) {
    elements.empty.classList.add("hidden");
  }
  
  const cardElement = createCardElement(item);
  
  if (isRead(item.link)) {
    elements.grid.appendChild(cardElement);
  } else {
    const firstReadCard = elements.grid.querySelector('.read');
    if (firstReadCard) {
      elements.grid.insertBefore(cardElement, firstReadCard);
    } else {
      elements.grid.appendChild(cardElement);
    }
  }
  
  animateCardEntry(cardElement);
}

function animateCardEntry(cardElement) {
  cardElement.style.opacity = '0';
  cardElement.style.transform = 'translateY(10px)';
  
  requestAnimationFrame(() => {
    cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    cardElement.style.opacity = isRead(cardElement.getAttribute('data-url')) ? '0.6' : '1';
    cardElement.style.transform = 'translateY(0)';
  });
}

export function renderItems(itemsToRender) {
  elements.grid.innerHTML = "";
  
  if (!itemsToRender.length) {
    elements.empty.classList.remove("hidden");
    return;
  }

  elements.empty.classList.add("hidden");
  
  const fragment = document.createDocumentFragment();
  
  const sortedItems = [...itemsToRender].sort((a, b) => {
    const aRead = isRead(a.link);
    const bRead = isRead(b.link);
    
    if (aRead && !bRead) return 1;
    if (!aRead && bRead) return -1;
    
    const aDate = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
    const bDate = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
    return bDate - aDate;
  });
  
  sortedItems.forEach(item => {
    const cardElement = createCardElement(item);
    fragment.appendChild(cardElement);
  });
  
  elements.grid.appendChild(fragment);
}