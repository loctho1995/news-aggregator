
// Main app entry point (clean replacement)

import { initializeUI, initializeEventHandlers } from './modules/initialization.js';
import { loadNews } from './modules/news-loader.js';
import { loadReadItems } from './modules/storage.js';

document.addEventListener("DOMContentLoaded", () => {
  // restore saved selection for better UX
  try {
    const g = localStorage.getItem("selectedGroup");
    if (g) {
      const el = document.getElementById("groupSelect");
      if (el) el.value = g;
    }
  } catch {}
  try {
    const s = localStorage.getItem("selectedSource");
    if (s) {
      const el2 = document.getElementById("sourceSelect");
      if (el2) el2.value = s;
    }
  } catch {}

  initializeUI();
  initializeEventHandlers();
  loadReadItems();
  // first load clears UI and fetches using current selects
  loadNews({ clear: true });
});
