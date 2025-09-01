// public/js/modules/news-loader.js
import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { addItemToGrid, renderItems } from './grid-manager.js';
import { populateSourceSelect } from './filters.js';
import { translateItemIfNeeded } from './translator.js';

let currentAbortController = null;
let currentLoadToken = 0;

// External cancel for other modules
export function cancelCurrentLoad() {
  try { currentAbortController?.abort(); } catch {}
  currentAbortController = null;
  currentLoadToken++; // invalidate any in-flight stream
}

// Main loader - OPTIMIZED FOR CACHE
export async function loadNews(options = {}) {
  const shouldClear = options.clear !== false;
  const hoursValue = elements.hours?.value || "48"; // Default 48 hours
  const groupValue = elements.groupSelect?.value || "all";
  const sourceValue = elements.sourceSelect?.value || "";

  // Clear UI if requested
  if (shouldClear) {
    updateState({ items: [] });
    if (elements.grid) elements.grid.innerHTML = "";
    elements.empty?.classList.add("hidden");
  }

  // Update badge to show loading
  const groupText = groupValue === "all" 
    ? "" 
    : (elements.groupSelect?.options[elements.groupSelect.selectedIndex]?.text || groupValue);
  
  if (elements.badge) {
    elements.badge.textContent = `Đang tải ${groupText}...`.trim();
    elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-yellow-600 text-white border border-yellow-500";
  }

  // Build URL - NO STREAMING for cached mode
  const groupParam = groupValue === 'all' ? '' : `&group=${encodeURIComponent(groupValue)}`;
  const sourceParam = sourceValue ? `&sources=${encodeURIComponent(sourceValue)}` : '';
  const url = `/api/news?hours=${encodeURIComponent(hoursValue)}${groupParam}${sourceParam}`;

  // Cancel any existing request
  cancelCurrentLoad();
  currentAbortController = new AbortController();
  const myToken = ++currentLoadToken;

  try {
    updateState({ loadingInProgress: true });

    const response = await fetch(url, { 
      signal: currentAbortController.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache' // Force server to check its cache
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Check if this is cached data
    if (data.cached) {
      console.log(`📦 Loaded from cache: ${data.totalItems} items (${data.cacheAge})`);
      
      // Update badge to show cache status
      if (elements.badge) {
        elements.badge.textContent = `${data.totalItems} tin • Cache ${data.cacheAge}`;
        elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-blue-600 text-white border border-blue-500";
      }
    } else if (data.status === 'loading') {
      // Cache is being populated
      console.log('⏳ Cache is being populated...');
      
      if (elements.badge) {
        elements.badge.textContent = `Đang cập nhật cache...`;
        elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-orange-600 text-white border border-orange-500";
      }
      
      // Show empty state with loading message
      if (data.items.length === 0) {
        elements.empty.innerHTML = `
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p class="text-slate-400">${data.message || 'Đang tải tin tức lần đầu...'}</p>
            <p class="text-xs text-slate-500 mt-2">Vui lòng đợi 10-20 giây</p>
          </div>
        `;
        elements.empty.classList.remove("hidden");
        
        // Auto-retry after 5 seconds if cache is loading
        setTimeout(() => {
          if (myToken === currentLoadToken) {
            console.log('🔄 Auto-retrying after cache population...');
            loadNews({ clear: false });
          }
        }, 5000);
        
        return;
      }
    }

    // Process items
    const items = data.items || [];
    
    // Store in state
    updateState({ items });

    // Render all items at once (fast for cached data)
    if (items.length > 0) {
      renderItems(items);
      elements.empty?.classList.add("hidden");
      
      // Update source filter
      populateSourceSelect();
      
      // Final badge update
      if (elements.badge) {
        const cacheInfo = data.cached ? ` • Cache` : '';
        elements.badge.textContent = `${items.length} tin${cacheInfo}`;
        elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-emerald-600 text-white border border-emerald-500";
      }
    } else {
      // Show empty state
      elements.empty?.classList.remove("hidden");
      
      if (elements.badge) {
        elements.badge.textContent = "Không có tin";
        elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-gray-600 text-white border border-gray-500";
      }
    }

  } catch (error) {
    if (error?.name === "AbortError") return; // Canceled is expected
    
    console.error("Error loading news:", error);
    handleLoadError(error);
  } finally {
    if (myToken === currentLoadToken) {
      updateState({ loadingInProgress: false });
      currentAbortController = null;
    }
  }
}

// Handle errors - try to use fallback cache if available
function handleLoadError(error) {
  console.error("Error loading news:", error);
  
  if (elements.badge) {
    elements.badge.textContent = "Lỗi tải";
    elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-red-600 text-white border border-red-500";
  }
  
  if (elements.grid) {
    elements.grid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-slate-400">Không thể tải tin tức.</p>
        <p class="text-xs text-slate-500 mt-2">Có thể do server đang khởi động hoặc mất kết nối</p>
        <button id="retryLoadBtn" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
          Thử lại
        </button>
      </div>
    `;
    
    setTimeout(() => {
      document.getElementById("retryLoadBtn")?.addEventListener("click", () => {
        loadNews({ clear: true });
      });
    }, 0);
  }
}

// Check cache status (optional - for debugging)
export async function checkCacheStatus() {
  try {
    const response = await fetch('/api/news/stats');
    if (response.ok) {
      const stats = await response.json();
      console.log('📊 Cache Stats:', stats);
      return stats;
    }
  } catch (error) {
    console.error('Failed to get cache stats:', error);
  }
  return null;
}