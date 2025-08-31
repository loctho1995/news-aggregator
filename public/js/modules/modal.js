// Modal management
// File: public/js/modules/modal.js

import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { markRead } from './read-status.js';
import { loadSummary } from './summary-loader.js';
import { resetTTS } from './tts.js';

// Prevent body scroll when modal is open
function preventBodyScroll() {
  // Store current scroll position
  const scrollY = window.scrollY;
  
  // Add styles to prevent scroll
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  
  // Store scroll position for restoration
  document.body.dataset.scrollY = scrollY;
  
  // Add class for CSS styling
  document.body.classList.add('modal-open');
}

// Restore body scroll when modal closes
function restoreBodyScroll() {
  const scrollY = document.body.dataset.scrollY || 0;
  
  // Remove styles
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  
  // Remove class
  document.body.classList.remove('modal-open');
  
  // Restore scroll position
  window.scrollTo(0, parseInt(scrollY));
  
  // Clean up
  delete document.body.dataset.scrollY;
}

export function openSummaryModal(item, link) {
  updateState({ 
    currentModalLink: link,
    currentItem: item 
  });
  
  elements.modalTitle.textContent = item?.title || "Tóm tắt";
  elements.modalSource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  elements.modalOpenLink.href = link;

  resetModalUI();
  loadSummary(item, link);
  markRead(link);

  // PREVENT BODY SCROLL ON MOBILE
  preventBodyScroll();

  elements.modal.classList.remove("hidden");
  elements.modal.classList.add("flex");
  elements.modal.scrollTop = 0;
  if (elements.modalPanel) elements.modalPanel.scrollTop = 0;
  if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
}

export function closeModal() {
  resetTTS();
  
  // RESTORE BODY SCROLL
  restoreBodyScroll();
  
  elements.modal.classList.add("hidden");
  elements.modal.classList.remove("flex");
  updateState({ 
    currentItem: null,
    currentModalLink: null 
  });
}

function resetModalUI() {
  elements.summaryLoading.classList.remove("hidden");
  elements.summaryList.classList.add("hidden");
  elements.summaryStats.classList.add("hidden");
  elements.summaryList.innerHTML = "";
  
  resetTTS();
  elements.btnSpeak.classList.add("hidden");
  elements.btnStopSpeak.classList.add("hidden");
  if (elements.ttsRateBox) elements.ttsRateBox.classList.add("hidden");
}