// public/js/modules/initialization.js
import { elements } from './elements.js';
import { loadNews, cancelCurrentLoad } from './news-loader.js';
import { updateFiltersAndRender } from './filters.js';
import { closeModal } from './modal.js';
import { handleSpeak, handleStopSpeak, handleRateChange } from './tts.js';

export function initializeUI() {}

export function initializeEventHandlers() {
  // Search debounce với null check
  let searchTimeout;
  if (elements.search) {
    elements.search.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(updateFiltersAndRender, 300);
    });
  }

  // Refresh button
  elements.refreshBtn?.addEventListener("click", () => loadNews({ clear: true }));

  // Source change với null check
  if (elements.sourceSelect) {
    elements.sourceSelect.addEventListener("change", () => {
      try { localStorage.setItem('selectedSource', elements.sourceSelect.value); } catch {}
      cancelCurrentLoad();
      loadNews({ clear: true });
    });
  }

  // Group change với null check
  if (elements.groupSelect) {
    elements.groupSelect.addEventListener("change", () => {
      try { localStorage.setItem('selectedGroup', elements.groupSelect.value); } catch {}
      if (elements.sourceSelect) {
        elements.sourceSelect.value = "";
      }
      if (elements.search) {
        elements.search.value = "";
      }
      try { localStorage.removeItem('selectedSource'); } catch {}
      cancelCurrentLoad();
      const grid = document.getElementById("grid");
      const empty = document.getElementById("empty");
      if (grid) grid.innerHTML = "";
      if (empty) empty.classList.add("hidden");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadNews({ clear: true });
    });
  }

  // Auto reload when hours dropdown changes
  if (elements.hours) {
    elements.hours.addEventListener("change", () => {
      try { localStorage.setItem("hours", elements.hours.value); } catch {}
      loadNews({ clear: true });
    });
  }

  // Keyboard ESC to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && elements.modal && !elements.modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // TTS
  elements.btnSpeak?.addEventListener("click", handleSpeak);
  elements.btnStopSpeak?.addEventListener("click", handleStopSpeak);
  elements.rateRange?.addEventListener("input", handleRateChange);
}