// App initialization
// File: public/js/modules/initialization.js

import { elements } from './elements.js';
import { state } from './state.js';
import { closeModal } from './modal.js';
import { loadSummary } from './summary-loader.js';
import { handleSpeak, handleStopSpeak, handleRateChange, setRateUI } from './tts.js';
import { updateFiltersAndRender } from './filters.js';
import { loadNews } from './news-loader.js';

export function initializeUI() {
  // Set initial TTS rate
  setRateUI(state.ttsRate);
  
  // No more CSS injection needed - CSS is loaded from external files
  console.log('UI initialized');
}

export function initializeEventHandlers() {
  // Modal events
  elements.modalClose?.addEventListener("click", closeModal);
  elements.modal?.addEventListener("click", (e) => {
    if (e.target === elements.modal || e.target === elements.modalOverlay) {
      closeModal();
    }
  });

  // Summary controls - AUTO RELOAD ON PERCENT CHANGE
  elements.summaryPercent?.addEventListener("change", () => {
    if (state.currentItem && state.currentModalLink) {
      loadSummary(state.currentItem, state.currentModalLink);
    }
  });

  // Hidden regenerate button (kept for compatibility but hidden in UI)
  elements.regenerateBtn?.addEventListener("click", () => {
    if (state.currentItem && state.currentModalLink) {
      loadSummary(state.currentItem, state.currentModalLink);
    }
  });

  // TTS events
  elements.btnSpeak?.addEventListener("click", handleSpeak);
  elements.btnStopSpeak?.addEventListener("click", handleStopSpeak);
  elements.rateRange?.addEventListener("input", handleRateChange);

  // Main app events
  let searchTimeout;
  elements.search?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(updateFiltersAndRender, 300);
  });

  elements.refreshBtn?.addEventListener("click", loadNews);
  elements.sourceSelect?.addEventListener("change", updateFiltersAndRender);
  elements.groupSelect?.addEventListener("change", () => {
    elements.sourceSelect.value = "";
    loadNews();
  });
  elements.hours?.addEventListener("change", loadNews);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !elements.modal.classList.contains("hidden")) {
      closeModal();
    }
  });
  
  console.log('Event handlers initialized');
}