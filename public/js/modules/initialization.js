// public/js/modules/initialization.js
import { elements } from './elements.js';
import { loadNews, cancelCurrentLoad } from './news-loader.js';
import { updateFiltersAndRender } from './filters.js';
import { closeModal } from './modal.js';
import { handleSpeak, handleStopSpeak, handleRateChange } from './tts.js';

export function initializeUI() {}

export function initializeEventHandlers() {
  // Search debounce
  let searchTimeout;
  elements.search?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(updateFiltersAndRender, 300);
  });

  // Refresh button - force refresh cache
  elements.refreshBtn?.addEventListener("click", () => {
    // Add refresh parameter to force cache update
    const url = new URL(window.location.origin + '/api/news');
    url.searchParams.set('refresh', 'true');
    url.searchParams.set('group', elements.groupSelect?.value || 'all');
    
    fetch(url, { method: 'GET' })
      .then(() => loadNews({ clear: true }))
      .catch(console.error);
  });

  // Source change - OPTIMIZED: No need to cancel if using cache
  elements.sourceSelect?.addEventListener("change", () => {
    try { localStorage.setItem('selectedSource', elements.sourceSelect.value); } catch {}
    
    // With cache, we can load immediately without canceling
    loadNews({ clear: true });
  });

  // Group change - OPTIMIZED: Instant switch with cache
  elements.groupSelect?.addEventListener("change", () => {
    try { localStorage.setItem('selectedGroup', elements.groupSelect.value); } catch {}
    
    // Reset filters
    elements.sourceSelect.value = "";
    elements.search.value = "";
    try { localStorage.removeItem('selectedSource'); } catch {}
    
    // Show loading state briefly
    const grid = document.getElementById("grid");
    const empty = document.getElementById("empty");
    
    // Add fade effect for smooth transition
    if (grid) {
      grid.style.opacity = '0.5';
      grid.style.transition = 'opacity 0.2s ease';
    }
    
    // Load new group data (will be instant with cache)
    loadNews({ clear: true });
    
    // Restore opacity after load
    setTimeout(() => {
      if (grid) {
        grid.style.opacity = '1';
      }
    }, 300);
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Hours change - Load from cache with different time filter
  elements.hours?.addEventListener("change", () => {
    try { localStorage.setItem("hours", elements.hours.value); } catch {}
    loadNews({ clear: true });
  });

  // Keyboard ESC to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !elements.modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // TTS handlers
  elements.btnSpeak?.addEventListener("click", handleSpeak);
  elements.btnStopSpeak?.addEventListener("click", handleStopSpeak);
  elements.rateRange?.addEventListener("input", handleRateChange);

  // Check cache status periodically (optional)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Only in development - check cache status
    setInterval(async () => {
      try {
        const response = await fetch('/api/news/stats');
        if (response.ok) {
          const stats = await response.json();
          console.log('📊 Cache Status:', {
            ready: stats.initialized,
            totalItems: stats.totalCached,
            groups: Object.keys(stats.groups).map(g => `${g}: ${stats.groups[g].itemCount} items`)
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }, 60000); // Check every minute in dev
  }
}