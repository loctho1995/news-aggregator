// Main app entry point

import { initializeUI, initializeEventHandlers } from './modules/initialization.js';
import { loadNews } from './modules/news-loader.js';
import { loadReadItems } from './modules/storage.js';

// Initialize app when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
  initializeEventHandlers();
  loadReadItems();
  loadNews();
});
