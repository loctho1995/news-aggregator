// Summary loading logic with better error handling
// File: public/js/modules/summary-loader.js

import { elements } from './elements.js';
import { ttsSupported } from './tts.js';
import { state } from './state.js';

// Detect if mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
}

export function loadSummary(item, link) {
  const isMobile = isMobileDevice();
  
  // Always use 70% default
  const percent = elements.summaryPercent.value || "70";
  
  // Pass fallback summary if available
  const fallbackParam = item.summary ? `&fallback=${encodeURIComponent(item.summary)}` : '';
  
  // Show loading with spinner for mobile
  if (isMobile) {
    elements.summaryLoading.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <svg class="animate-spin h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg">Đang tải ${percent}%...</span>
      </div>
    `;
  } else {
    elements.summaryLoading.textContent = `Đang tóm tắt ${percent}% nội dung...`;
  }
  
  elements.summaryLoading.classList.remove("hidden");
  elements.summaryList.classList.add("hidden");
  elements.summaryStats.classList.add("hidden");
  
  const url = `/api/summary?url=${encodeURIComponent(link)}&percent=${percent}${fallbackParam}`;
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutDuration = isMobile ? 15000 : 20000; // Increased: 15s for mobile, 20s for desktop
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutDuration);
  
  fetch(url, { 
    signal: controller.signal,
    headers: {
      'X-Mobile': isMobile ? 'true' : 'false',
      'X-Client-Type': isMobile ? 'mobile' : 'desktop'
    }
  })
    .then(async (r) => {
      clearTimeout(timeoutId);
      const j = await r.json();
      
      // Even if there's an error flag, still show content if available
      if (j.error && !j.bullets && !j.fullSummary) {
        throw new Error(j.error);
      }
      
      // Show content even if it's fallback
      updateModalWithSummary(j, item, isMobile);
      
      if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      console.error('Summary error:', err);
      
      // Always show something useful
      if (err.name === 'AbortError') {
        showTimeoutFallback(item, isMobile);
      } else {
        showErrorFallback(item, isMobile, err.message);
      }
      
      if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
    });
}

function updateModalWithSummary(data, item, isMobile = false) {
  // Update source info
  if (data.percentage !== undefined) {
    const percentColor = data.percentage > 70 ? "text-orange-600" : 
                       data.percentage > 40 ? "text-yellow-600" : "text-emerald-600";
    const sizeInfo = data.originalLength && !isMobile ? ` (${data.summaryLength}/${data.originalLength} ký tự)` : "";
    const translatedText = data.translated ? ` • 🌐 Đã dịch` : "";
    const fallbackText = data.fallback ? ` • ⚠️ Tóm tắt từ bản lưu` : "";
    
    elements.modalSource.innerHTML = `
      <span>Nguồn: ${item.sourceName || ""}</span>
      <span class="${percentColor} ml-2">${data.percentage}%${sizeInfo}</span>
      ${translatedText}
      ${fallbackText}
    `;
  } else {
    elements.modalSource.textContent = `Nguồn: ${item.sourceName || ""}`;
  }
  
  // Show error notice if present but still has content
  if (data.error && data.bullets) {
    const errorNotice = `
      <div class="mb-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm">
        <p class="font-bold">⚠️ Lưu ý</p>
        <p>Không thể tải nội dung mới nhất. Đang hiển thị tóm tắt có sẵn.</p>
      </div>
    `;
    elements.summaryList.innerHTML = errorNotice;
  } else {
    elements.summaryList.innerHTML = '';
  }
  
  // Render content
  const html = renderSummaryContent({
    paragraphs: data.paragraphs || null,
    bullets: data.bullets || [],
    fallbackText: data.fullSummary || item.summary || "",
    isMobile
  });
  
  elements.summaryList.innerHTML += html;
  elements.summaryLoading.classList.add("hidden");
  elements.summaryList.classList.remove("hidden");
  
  // Show stats (only if translated)
  if (data.translated) {
    elements.summaryStats.classList.remove("hidden");
    elements.translatedBadge.style.display = 'flex';
  } else {
    elements.summaryStats.classList.add("hidden");
    elements.translatedBadge.style.display = 'none';
  }
  
  // Enable TTS (but hide on mobile for performance)
  if (ttsSupported() && !isMobile) {
    elements.btnSpeak.classList.remove("hidden");
    elements.btnStopSpeak.classList.remove("hidden");
    if (elements.ttsRateBox) elements.ttsRateBox.classList.remove("hidden");
  }
}

function renderSummaryContent({ bullets, paragraphs, fallbackText, isMobile }) {
  // Reduce animations on mobile
  const animationClass = isMobile ? "" : "hover:bg-white/80 transition-colors";
  
  if (paragraphs && paragraphs.length > 0) {
    return renderParagraphSummary(paragraphs, animationClass);
  }
  
  if (bullets && bullets.length > 0) {
    return renderBulletSummary(bullets, animationClass);
  }
  
  return fallbackText ? 
    `<p class="text-gray-700 text-lg">${fallbackText}</p>` : 
    `<p class="text-gray-500 italic text-lg">Không có nội dung tóm tắt.</p>`;
}

function renderParagraphSummary(paragraphs, animationClass) {
  return paragraphs.map((paragraph, index) => `
    <div class="mb-3 p-3 bg-white/60 rounded-lg border-l-4 border-emerald-500 ${animationClass}" 
         style="animation-delay: ${index * 0.1}s">
      <p class="text-gray-800 leading-relaxed text-base sm:text-lg">${paragraph}</p>
    </div>
  `).join('');
}

function renderBulletSummary(bullets, animationClass) {
  return bullets.map((bullet, index) => `
    <div class="mb-2 p-3 bg-white/50 rounded-lg border-l-4 border-emerald-500 ${animationClass}"
         style="animation-delay: ${index * 0.1}s">
      <p class="text-gray-800 leading-relaxed text-base sm:text-lg">${bullet}</p>
    </div>
  `).join('');
}

// Timeout fallback
function showTimeoutFallback(item, isMobile) {
  const retryMessage = isMobile ? 
    "Kết nối mạng chậm. Đang thử lại..." :
    "Tải nội dung mất nhiều thời gian...";
  
  const html = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="text-lg text-gray-600 mb-2">Kết nối chậm</p>
      <p class="text-sm text-gray-500 mb-4">${retryMessage}</p>
      
      ${item.summary ? `
        <div class="text-left bg-white/50 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-600 mb-2">📄 Tóm tắt có sẵn:</p>
          <p class="text-gray-800">${item.summary}</p>
        </div>
      ` : ''}
      
      <div class="flex gap-2 justify-center">
        <button onclick="window.retryLoadSummary()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
          🔄 Thử lại
        </button>
        <a href="${item.link}" target="_blank" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">
          📖 Đọc trực tiếp
        </a>
      </div>
    </div>
  `;
  
  elements.summaryList.innerHTML = html;
  elements.summaryLoading.classList.add("hidden");
  elements.summaryList.classList.remove("hidden");
  
  // Make retry function available globally
  window.retryLoadSummary = () => {
    if (state.currentItem && state.currentModalLink) {
      loadSummary(state.currentItem, state.currentModalLink);
    }
  };
}

// Error fallback with more helpful message
function showErrorFallback(item, isMobile, errorMessage) {
  const html = `
    <div class="space-y-4">
      <!-- Error notice -->
      <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Không thể tải nội dung</h3>
            <p class="mt-1 text-sm text-red-700">
              Website có thể đang bảo trì hoặc chặn truy cập tự động.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Available summary if exists -->
      ${item.summary ? `
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm font-semibold text-gray-600 mb-2">📋 Tóm tắt có sẵn:</p>
          <p class="text-gray-800 leading-relaxed">${item.summary}</p>
        </div>
      ` : `
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-gray-600">Không có tóm tắt sẵn có.</p>
        </div>
      `}
      
      <!-- Action buttons -->
      <div class="flex gap-2 justify-center pt-4">
        <button onclick="window.retryLoadSummary()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Thử lại
        </button>
        <a href="${item.link}" target="_blank" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Đọc bài gốc
        </a>
      </div>
      
      <!-- Technical details (collapsible) -->
      <details class="text-xs text-gray-500 mt-4">
        <summary class="cursor-pointer hover:text-gray-700">Chi tiết lỗi</summary>
        <p class="mt-2 font-mono bg-gray-100 p-2 rounded">${errorMessage || 'Unknown error'}</p>
      </details>
    </div>
  `;
  
  elements.summaryList.innerHTML = html;
  elements.summaryLoading.classList.add("hidden");
  elements.summaryList.classList.remove("hidden");
  
  // Make retry function available
  window.retryLoadSummary = () => {
    if (state.currentItem && state.currentModalLink) {
      loadSummary(state.currentItem, state.currentModalLink);
    }
  };
}