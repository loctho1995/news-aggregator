// VN NEWS AGGREGATOR - APP.JS - SIMPLE MODAL VERSION

// UI Elements - Modal
const modal = document.getElementById("modal");
const modalOverlay = document.getElementById("modalOverlay");
const modalPanel = document.getElementById("modalPanel");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalSource = document.getElementById("modalSource");
const modalOpenLink = document.getElementById("modalOpenLink");

// UI Elements - Summary controls
const summaryPercent = document.getElementById("summaryPercent");
const regenerateBtn = document.getElementById("regenerateBtn");
const summaryArea = document.getElementById("summaryArea");
const summaryLoading = document.getElementById("summaryLoading");
const summaryList = document.getElementById("summaryList");
const summaryStats = document.getElementById("summaryStats");
const compression = document.getElementById("compression");
const translatedBadge = document.getElementById("translatedBadge");
const bulletCount = document.getElementById("bulletCount");

// UI Elements - TTS
const btnSpeak = document.getElementById("btnSpeak");
const btnStopSpeak = document.getElementById("btnStopSpeak");
const ttsRateBox = document.getElementById("ttsRateBox");
const rateRange = document.getElementById("rateRange");
const rateLabel = document.getElementById("rateLabel");

// UI Elements - Main app
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const badge = document.getElementById("badge");
const search = document.getElementById("search");
const sourceSelect = document.getElementById("sourceSelect");
const groupSelect = document.getElementById("groupSelect");
const hours = document.getElementById("hours");
const refreshBtn = document.getElementById("refreshBtn");

let loadingInProgress = false;
let currentFilters = {
  query: "",
  sources: [],
  group: null
};

// State variables
let currentItem = null;
let currentModalLink = null;
let ttsState = "idle"; // "idle", "speaking", "paused"
let ttsRate = 1.0;
let items = [];
let readItems = new Set();

// ===== MODAL FUNCTIONS =====

// Main function mở modal
function openSummaryModal(item, link) {
  currentModalLink = link;
  currentItem = item;
  
  modalTitle.textContent = item?.title || "Tóm tắt";
  modalSource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  modalOpenLink.href = link;

  resetModalUI();
  loadSummary(item, link);
  markRead(link);

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.scrollTop = 0;
  if (modalPanel) modalPanel.scrollTop = 0;
  if (summaryArea) summaryArea.scrollTop = 0;
}

// Reset modal UI
function resetModalUI() {
  summaryLoading.classList.remove("hidden");
  summaryList.classList.add("hidden");
  summaryStats.classList.add("hidden");
  summaryList.innerHTML = "";
  
  if (ttsSupported()) {
    window.speechSynthesis.cancel();
    ttsState = "idle";
    btnSpeak.textContent = "🔊 Đọc to";
    btnSpeak.classList.add("hidden");
    btnStopSpeak.classList.add("hidden");
    if (ttsRateBox) ttsRateBox.classList.add("hidden");
    setRateUI(ttsRate);
  }
}

// Load summary với phần trăm được chọn
function loadSummary(item, link) {
  const percent = summaryPercent.value || "70";
  
  summaryLoading.textContent = `Đang tóm tắt ${percent}% nội dung…`;
  summaryLoading.classList.remove("hidden");
  summaryList.classList.add("hidden");
  summaryStats.classList.add("hidden");
  
  const url = `/api/summary?url=${encodeURIComponent(link)}&percent=${percent}`;
  
  fetch(url)
    .then(async (r) => {
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      
      if (j.percentage !== undefined) {
        const percentColor = j.percentage > 70 ? "text-orange-600" : 
                           j.percentage > 40 ? "text-yellow-600" : "text-emerald-600";
        const sizeInfo = j.originalLength ? ` (${j.summaryLength}/${j.originalLength} ký tự)` : "";
        const translatedText = j.translated ? ` • 🌍 Đã dịch` : "";
        
        modalSource.innerHTML = `
          <span>Nguồn: ${item.sourceName || ""}</span>
          <span class="mx-2">•</span>
          <span class="${percentColor}">Tóm tắt ${j.percentage}%${sizeInfo}</span>
          ${translatedText}
        `;
      }
      
      const html = renderSummaryContent({
        bullets: j.bullets || [],
        fallbackText: item.summary || "",
      });
      
      summaryList.innerHTML = html;
      summaryLoading.classList.add("hidden");
      summaryList.classList.remove("hidden");
      
      summaryStats.classList.remove("hidden");
      if (j.percentage) compression.textContent = `${100 - j.percentage}%`;
      if (j.bullets) bulletCount.textContent = j.bullets.length;
      
      if (j.translated) {
        translatedBadge.style.display = 'flex';
      } else {
        translatedBadge.style.display = 'none';
      }
      
      if (ttsSupported()) {
        btnSpeak.classList.remove("hidden");
        btnStopSpeak.classList.remove("hidden");
        if (ttsRateBox) ttsRateBox.classList.remove("hidden");
      }
      
      if (summaryArea) summaryArea.scrollTop = 0;
    })
    .catch((err) => {
      console.error('Summary error:', err);
      const html = renderSummaryContent({
        bullets: [],
        fallbackText: item.summary || "Không thể tải tóm tắt.",
      });
      summaryList.innerHTML = html;
      summaryLoading.classList.add("hidden");
      summaryList.classList.remove("hidden");
      
      if (ttsSupported()) {
        btnSpeak.classList.remove("hidden");
        btnStopSpeak.classList.remove("hidden");
        if (ttsRateBox) ttsRateBox.classList.remove("hidden");
      }
      
      if (summaryArea) summaryArea.scrollTop = 0;
    });
}

// Render summary content
function renderSummaryContent({ bullets, fallbackText }) {
  if (!bullets || bullets.length === 0) {
    return fallbackText ? `<p class="text-gray-700">${fallbackText}</p>` : 
           `<p class="text-gray-500 italic">Không có nội dung tóm tắt.</p>`;
  }
  
  return bullets.map(bullet => `
    <div class="mb-3 p-3 bg-white/50 rounded-lg border-l-4 border-emerald-500">
      <p class="text-gray-800 leading-relaxed">${bullet}</p>
    </div>
  `).join('');
}

// Close modal
function closeModal() {
  if (ttsSupported()) {
    window.speechSynthesis.cancel();
    ttsState = "idle";
    btnSpeak.textContent = "🔊 Đọc to";
  }
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  currentItem = null;
  currentModalLink = null;
}

// ===== TTS FUNCTIONS =====

function ttsSupported() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function setRateUI(rate) {
  if (rateRange) rateRange.value = rate;
  if (rateLabel) rateLabel.textContent = `${rate}x`;
}

// ===== MAIN APP FUNCTIONS =====

function markRead(url) {
  readItems.add(url);
  const card = document.querySelector(`[data-url="${CSS.escape(url)}"]`);
  if (card) {
    card.classList.add("opacity-60");
    card.classList.add("read");
  }
}

function isRead(url) {
  return readItems.has(url);
}

function timeAgo(iso) {
  if (!iso) return "";
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} ngày trước`;
  if (diffHours > 0) return `${diffHours} giờ trước`;
  return "vừa xong";
}

function truncate(text, maxLength = 120) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

function itemPassesFilters(item, filters) {
  if (filters.group && item.group !== filters.group) return false;
  if (filters.sources.length && !filters.sources.includes(item.sourceId)) return false;
  
  if (filters.query) {
    const query = filters.query.toLowerCase();
    const titleMatch = item.title && item.title.toLowerCase().includes(query);
    const summaryMatch = item.summary && item.summary.toLowerCase().includes(query);
    if (!titleMatch && !summaryMatch) return false;
  }
  
  return true;
}

function addItemToGrid(item) {
  if (!itemPassesFilters(item, currentFilters)) return;
  
  if (!empty.classList.contains("hidden")) {
    empty.classList.add("hidden");
  }
  
  const cardElement = createCardElement(item);
  grid.appendChild(cardElement);
  
  cardElement.style.opacity = '0';
  cardElement.style.transform = 'translateY(10px)';
  
  requestAnimationFrame(() => {
    cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    cardElement.style.opacity = '1';
    cardElement.style.transform = 'translateY(0)';
  });
}

function createCardElement(item) {
  const card = document.createElement('div');
  card.className = `news-card bg-[#40414f] border border-[#565869] rounded-2xl p-4 hover:border-[#6b7280] transition-colors ${isRead(item.link) ? "opacity-60 read" : ""}`;
  card.setAttribute('data-url', item.link);
  card.setAttribute('data-title', item.title || '');
  card.setAttribute('data-source', item.sourceName || '');
  
  const groupBadge = item.group === 'internationaleconomics' ? 
    '<span class="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">🌍 Quốc tế</span>' : '';
  
  card.innerHTML = `
    <div class="flex items-start justify-between gap-2 mb-2">
      <h3 class="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
        ${item.title || "Không có tiêu đề"}
      </h3>
      ${item.image ? `<img src="${item.image}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0 ml-2" loading="lazy" onerror="this.style.display='none'">` : ''}
    </div>
    
    <p class="text-xs text-slate-300 mb-3 line-clamp-4">
      ${truncate(item.summary || "Không có tóm tắt.")}
    </p>
    
    <div class="flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-2">
        <span class="font-medium text-emerald-400">${item.sourceName || "N/A"}</span>
        ${groupBadge}
        ${item.translated ? '<span class="text-blue-400">🌍</span>' : ''}
      </div>
      <span>${timeAgo(item.publishedAt)}</span>
    </div>
    
    <div class="flex gap-2 mt-3">
      <button class="summary-btn flex-1 px-3 py-1.5 text-xs bg-[#565869] hover:bg-[#6b7280] text-slate-200 rounded-lg transition-colors">
        📄 Tóm tắt
      </button>
      <a href="${item.link}" target="_blank" rel="noopener" 
         class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
        Đọc gốc ↗
      </a>
    </div>
  `;
  
  // Add event listener directly
  const summaryBtn = card.querySelector('.summary-btn');
  summaryBtn.addEventListener('click', () => {
    openSummaryModal(item, item.link);
  });
  
  return card;
}

function renderItems(itemsToRender) {
  grid.innerHTML = "";
  
  if (!itemsToRender.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  
  const fragment = document.createDocumentFragment();
  
  itemsToRender.forEach(item => {
    const cardElement = createCardElement(item);
    fragment.appendChild(cardElement);
  });
  
  grid.appendChild(fragment);
}

function updateFilters() {
  currentFilters = {
    query: search.value.toLowerCase().trim(),
    sources: sourceSelect.value ? [sourceSelect.value] : [],
    group: groupSelect.value === 'all' ? null : groupSelect.value
  };
  
  const filtered = items.filter(item => itemPassesFilters(item, currentFilters));
  renderItems(filtered);
}

async function loadNews() {
  if (loadingInProgress) return;
  
  try {
    loadingInProgress = true;
    
    items = [];
    grid.innerHTML = "";
    empty.classList.add("hidden");
    
    badge.textContent = "Đang tải…";
    badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-yellow-600 text-white border border-yellow-500";
    
    const selectedGroup = groupSelect.value === 'all' ? '' : `&group=${groupSelect.value}`;
    const hoursValue = hours.value || "24";
    
    const response = await fetch(`/api/news?hours=${hoursValue}${selectedGroup}&stream=true`);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let itemCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          
          if (item.error) {
            console.warn(`Source ${item.sourceId} failed: ${item.message}`);
            continue;
          }
          
          items.push(item);
          itemCount++;
          
          addItemToGrid(item);
          
          badge.textContent = `${itemCount} bài`;
          
        } catch (e) {
          continue;
        }
      }
    }
    
    badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-emerged-600 text-white border border-emerald-500";
    
    populateSourceSelect();
    
    if (itemCount === 0) {
      empty.classList.remove("hidden");
    }
    
  } catch (error) {
    console.error("Error loading news:", error);
    badge.textContent = "Lỗi tải";
    badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-red-600 text-white border border-red-500";
    
    grid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-slate-400">Không thể tải tin tức. Vui lòng thử lại.</p>
        <button onclick="loadNews()" class="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
          Thử lại
        </button>
      </div>
    `;
  } finally {
    loadingInProgress = false;
  }
}

let populateTimeout;
function populateSourceSelect() {
  clearTimeout(populateTimeout);
  populateTimeout = setTimeout(() => {
    const sources = [...new Set(items.map(item => ({ id: item.sourceId, name: item.sourceName })))];
    sources.sort((a, b) => a.name.localeCompare(b.name));
    
    const currentValue = sourceSelect.value;
    sourceSelect.innerHTML = '<option value="">Tất cả nguồn</option>' + 
      sources.map(s => `<option value="${s.id}"${s.id === currentValue ? ' selected' : ''}>${s.name}</option>`).join('');
  }, 100);
}

// ===== EVENT HANDLERS =====

// Modal events
modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target === modal || e.target === modalOverlay) {
    closeModal();
  }
});

// Summary controls
regenerateBtn?.addEventListener("click", () => {
  if (currentItem && currentModalLink) {
    loadSummary(currentItem, currentModalLink);
  }
});

summaryPercent?.addEventListener("change", () => {
  if (currentItem && currentModalLink) {
    loadSummary(currentItem, currentModalLink);
  }
});

// TTS events
btnSpeak?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  
  if (ttsState === "idle") {
    const text = summaryList.textContent || "";
    if (!text.trim()) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.lang = 'vi-VN';
    
    utterance.onstart = () => {
      ttsState = "speaking";
      btnSpeak.textContent = "⏸️ Tạm dừng";
    };
    
    utterance.onend = () => {
      ttsState = "idle";
      btnSpeak.textContent = "🔊 Đọc to";
    };
    
    utterance.onerror = () => {
      ttsState = "idle";
      btnSpeak.textContent = "🔊 Đọc to";
    };
    
    window.speechSynthesis.speak(utterance);
  } else if (ttsState === "speaking") {
    window.speechSynthesis.pause();
    ttsState = "paused";
    btnSpeak.textContent = "▶️ Tiếp tục";
  } else if (ttsState === "paused") {
    window.speechSynthesis.resume();
    ttsState = "speaking";
    btnSpeak.textContent = "⏸️ Tạm dừng";
  }
});

btnStopSpeak?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  
  window.speechSynthesis.cancel();
  ttsState = "idle";
  btnSpeak.textContent = "🔊 Đọc to";
});

rateRange?.addEventListener("input", (e) => {
  ttsRate = parseFloat(e.target.value);
  setRateUI(ttsRate);
});

// Main app events
let searchTimeout;
search?.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(updateFilters, 300);
});

refreshBtn?.addEventListener("click", loadNews);
sourceSelect?.addEventListener("change", updateFilters);
groupSelect?.addEventListener("change", () => {
  sourceSelect.value = "";
  loadNews();
});
hours?.addEventListener("change", loadNews);

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  loadNews();
});