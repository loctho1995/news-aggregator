// Summary loading logic with mobile optimizations
// File: public/js/modules/summary-loader.js

import { elements } from './elements.js';
import { ttsSupported } from './tts.js';

// Detect if mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
}

export function loadSummary(item, link) {
  const isMobile = isMobileDevice();
  
  // Use lower percent for mobile by default for faster loading
  let percent = elements.summaryPercent.value || "70";
  
  // Auto-adjust percent for mobile if it's the default value
  if (isMobile && percent === "70") {
    percent = "50"; // Lower default for mobile
    elements.summaryPercent.value = "50"; // Update UI
  }
  
  // Show loading with spinner for mobile
  if (isMobile) {
    elements.summaryLoading.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <svg class="animate-spin h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg">Đang tải nhanh ${percent}%...</span>
      </div>
    `;
  } else {
    elements.summaryLoading.textContent = `Đang tóm tắt ${percent}% nội dung...`;
  }
  
  elements.summaryLoading.classList.remove("hidden");
  elements.summaryList.classList.add("hidden");
  elements.summaryStats.classList.add("hidden");
  
  const url = `/api/summary?url=${encodeURIComponent(link)}&percent=${percent}`;
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutDuration = isMobile ? 8000 : 15000; // 8s for mobile, 15s for desktop
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutDuration);
  
  fetch(url, { 
    signal: controller.signal,
    headers: {
      'X-Mobile': isMobile ? 'true' : 'false', // Help server identify mobile
      'X-Client-Type': isMobile ? 'mobile' : 'desktop'
    }
  })
    .then(async (r) => {
      clearTimeout(timeoutId);
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      
      updateModalWithSummary(j, item, isMobile);
      
      if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      console.error('Summary error:', err);
      
      // Better error handling for mobile
      if (err.name === 'AbortError') {
        showMobileTimeoutFallback(item, isMobile);
      } else {
        showFallbackSummary(item, isMobile);
      }
      
      if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
    });
}

function updateModalWithSummary(data, item, isMobile = false) {
  // Update source info
  if (data.percentage !== undefined) {
    const percentColor = data.percentage > 70 ? "text-orange-600" : 
                       data.percentage > 40 ? "text-yellow-600" : "text-emerald-600";
    const sizeInfo = data.originalLength ? ` (${data.summaryLength}/${data.originalLength} ký tự)` : "";
    const translatedText = data.translated ? ` • 🌐 Đã dịch` : "";
    
    elements.modalSource.innerHTML = `
      <span>Nguồn: ${item.sourceName || ""}</span>
      <span class="mx-2">•</span>
      <span class="${percentColor}">Tóm tắt ${data.percentage}%${sizeInfo}</span>
      ${translatedText}
    `;
  }
  
  // Render content
  const html = renderSummaryContent({
    paragraphs: data.paragraphs || null,
    bullets: data.bullets || [],
    fallbackText: data.fullSummary || item.summary || "",
    isMobile
  });
  
  elements.summaryList.innerHTML = html;
  elements.summaryLoading.classList.add("hidden");
  elements.summaryList.classList.remove("hidden");
  
  // Show stats
  elements.summaryStats.classList.remove("hidden");
  
  if (data.translated) {
    elements.translatedBadge.style.display = 'flex';
  } else {
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
    <div class="mb-4 p-4 bg-white/60 rounded-lg border-l-4 border-emerald-500 ${animationClass}" 
         style="animation-delay: ${index * 0.1}s">
      <p class="text-gray-800 leading-relaxed text-lg">${paragraph}</p>
    </div>
  `).join('');
}

function renderBulletSummary(bullets, animationClass) {
  return bullets.map((bullet, index) => `
    <div class="mb-3 p-4 bg-white/50 rounded-lg border-l-4 border-emerald-500 ${animationClass}"
         style="animation-delay: ${index * 0.1}s">
      <p class="text-gray-800 leading-relaxed text-lg">${bullet}</p>
    </div>
  `).join('');
}

// Special timeout fallback for mobile
function showMobileTimeoutFallback(item, isMobile) {
  const retryMessage = isMobile ? 
    "Kết nối mạng di động chậm. Vui lòng thử lại." :
    "Không thể tải tóm tắt do timeout.";
  
  const html = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="text-lg text-gray-600 mb-2">Kết nối chậm</p>
      <p class="text-sm text-gray-500 mb-4">${retryMessage}</p>
      
      ${item.summary ? `
        <div class="text-left bg-white/50 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-600 mb-2">Tóm tắt có sẵn:</p>
          <p class="text-gray-800">${item.summary}</p>
        </div>
      ` : ''}
      
      <button onclick="window.loadSummary()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
        Thử lại
      </button>
    </div>
  `;
  
  elements.summaryList.innerHTML = html;
  elements.summaryLoading.classList.add("hidden");
  elements.summaryList.classList.remove("hidden");
  
  // Make loadSummary available globally for the retry button
  window.loadSummary = () => loadSummary(item, item.link);
}

function showFallbackSummary(item, isMobile = false) {
  const html = renderSummaryContent({
    paragraphs: null,
    bullets: [],
    fallbackText: item.summary || "Không thể tải tóm tắt.",
    isMobile
  });
  
  elements.summaryList.innerHTML = html;
  elements.summaryLoading.classList.add("hidden");
  elements.summaryList.classList.remove("hidden");
  
  if (ttsSupported() && !isMobile) {
    elements.btnSpeak.classList.remove("hidden");
    elements.btnStopSpeak.classList.remove("hidden");
    if (elements.ttsRateBox) elements.ttsRateBox.classList.remove("hidden");
  }
}