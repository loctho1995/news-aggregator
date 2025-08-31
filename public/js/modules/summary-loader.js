// Summary loading logic with real-time progress
// File: public/js/modules/summary-loader.js

import { elements } from './elements.js';
import { ttsSupported } from './tts.js';
import { state } from './state.js';

// Detect if mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
}

// Main load function - uses simulated progress (simpler approach)
export function loadSummary(item, link) {
  const isMobile = isMobileDevice();
  const percent = elements.summaryPercent.value || "70";
  
  // Animated progress bar
  let progress = 0;
  let progressInterval;
  
  const stages = [
    { at: 10, text: 'Đang kết nối server...', duration: 1000 },
    { at: 25, text: 'Đang tải trang web...', duration: 3000 },
    { at: 45, text: 'Đang phân tích nội dung...', duration: 2500 },
    { at: 65, text: 'Đang trích xuất thông tin...', duration: 2000 },
    { at: 80, text: `Đang tóm tắt ${percent}% nội dung...`, duration: 2500 },
    { at: 95, text: 'Đang hoàn thiện...', duration: 1000 }
  ];
  
  // Show progress UI
  elements.summaryLoading.innerHTML = `
    <div class="flex flex-col items-center gap-3">
      <div class="w-full max-w-md">
        <div class="flex justify-between text-sm text-gray-600 mb-2">
          <span id="loadingText" class="text-gray-700">Đang khởi tạo...</span>
          <span id="loadingPercent" class="font-semibold">0%</span>
        </div>
        <div class="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div id="progressBar" class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500 ease-out" style="width: 0%">
            <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <div class="mt-2 text-xs text-gray-500 text-center">
          <span id="progressDetail">Vui lòng đợi...</span>
        </div>
      </div>
    </div>
  `;
  
  elements.summaryLoading.classList.remove("hidden");
  elements.summaryList.classList.add("hidden");
  elements.summaryStats.classList.add("hidden");
  
  // Animate progress through stages
  let stageIndex = 0;
  let fetchCompleted = false;
  let fetchResult = null;
  let fetchError = null;
  
  const animateStage = () => {
    if (stageIndex >= stages.length || fetchCompleted) return;
    
    const stage = stages[stageIndex];
    const startProgress = stageIndex > 0 ? stages[stageIndex - 1].at : 0;
    const steps = stage.at - startProgress;
    const stepDuration = stage.duration / steps;
    
    const loadingText = document.getElementById('loadingText');
    const progressDetail = document.getElementById('progressDetail');
    
    if (loadingText) loadingText.textContent = stage.text;
    if (progressDetail) progressDetail.textContent = `Bước ${stageIndex + 1}/${stages.length}`;
    
    let currentStep = 0;
    progressInterval = setInterval(() => {
      if (fetchCompleted) {
        clearInterval(progressInterval);
        return;
      }
      
      progress = Math.min(95, startProgress + currentStep);
      const progressBar = document.getElementById('progressBar');
      const loadingPercent = document.getElementById('loadingPercent');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (loadingPercent) loadingPercent.textContent = `${progress}%`;
      
      currentStep++;
      if (currentStep > steps) {
        clearInterval(progressInterval);
        stageIndex++;
        if (stageIndex < stages.length && !fetchCompleted) {
          setTimeout(animateStage, 100);
        }
      }
    }, stepDuration);
  };
  
  // Start animation
  animateStage();
  
  // Actually fetch data
  const fallbackParam = item.summary ? `&fallback=${encodeURIComponent(item.summary)}` : '';
  const url = `/api/summary?url=${encodeURIComponent(link)}&percent=${percent}${fallbackParam}`;
  
  // INCREASED TIMEOUT - 30s for mobile, 45s for desktop
  const timeoutDuration = isMobile ? 30000 : 45000;
  let timeoutId;
  
  // Create custom timeout promise instead of AbortController
  const fetchWithTimeout = async () => {
    return Promise.race([
      fetch(url, {
        headers: {
          'X-Mobile': isMobile ? 'true' : 'false',
          'X-Client-Type': isMobile ? 'mobile' : 'desktop'
        }
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, timeoutDuration);
      })
    ]);
  };
  
  fetchWithTimeout()
    .then(async (response) => {
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      fetchCompleted = true;
      clearInterval(progressInterval);
      
      // Even if there's an error flag, still show content if available
      if (data.error && !data.bullets && !data.fullSummary) {
        throw new Error(data.error);
      }
      
      // Complete progress animation
      const progressBar = document.getElementById('progressBar');
      const loadingPercent = document.getElementById('loadingPercent');
      const loadingText = document.getElementById('loadingText');
      const progressDetail = document.getElementById('progressDetail');
      
      if (progressBar) {
        progressBar.style.width = '100%';
        progressBar.classList.remove('from-emerald-400', 'to-emerald-600');
        progressBar.classList.add('from-green-400', 'to-green-600');
      }
      if (loadingPercent) loadingPercent.textContent = '100%';
      if (loadingText) loadingText.textContent = 'Hoàn tất!';
      if (progressDetail) progressDetail.textContent = 'Đang hiển thị kết quả...';
      
      // Show content after animation completes
      setTimeout(() => {
        updateModalWithSummary(data, item, isMobile);
        if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
      }, 500);
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      fetchCompleted = true;
      clearInterval(progressInterval);
      
      console.error('Summary error:', err);
      
      // Check if it's a timeout error
      const isTimeout = err.message === 'Request timeout' || err.name === 'AbortError';
      
      if (isTimeout) {
        // Try to use fallback content if available
        if (item.summary) {
          // Create a fake success response with fallback content
          const fallbackData = {
            bullets: [`• ${item.summary.substring(0, 300)}`],
            paragraphs: [item.summary],
            fullSummary: item.summary,
            percentage: 100,
            fallback: true,
            fallbackReason: 'timeout'
          };
          
          // Show as success with warning
          const progressBar = document.getElementById('progressBar');
          const loadingText = document.getElementById('loadingText');
          const progressDetail = document.getElementById('progressDetail');
          
          if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.classList.remove('from-emerald-400', 'to-emerald-600');
            progressBar.classList.add('from-yellow-400', 'to-yellow-600');
          }
          if (loadingText) loadingText.textContent = 'Sử dụng bản lưu';
          if (progressDetail) progressDetail.textContent = 'Kết nối chậm, hiển thị nội dung có sẵn';
          
          setTimeout(() => {
            updateModalWithSummary(fallbackData, item, isMobile);
            if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
          }, 1000);
        } else {
          // No fallback available, show timeout error
          showTimeoutFallback(item, isMobile);
        }
      } else {
        // Other errors
        const progressBar = document.getElementById('progressBar');
        const loadingText = document.getElementById('loadingText');
        const progressDetail = document.getElementById('progressDetail');
        
        if (progressBar) {
          progressBar.classList.remove('from-emerald-400', 'to-emerald-600');
          progressBar.classList.add('bg-red-500');
        }
        if (loadingText) loadingText.textContent = 'Lỗi tải nội dung';
        if (progressDetail) progressDetail.textContent = err.message || 'Không thể kết nối';
        
        setTimeout(() => {
          showErrorFallback(item, isMobile, err.message);
          if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
        }, 1500);
      }
    });
}

// Update modal with summary data
function updateModalWithSummary(data, item, isMobile = false) {
  // Update source info
  if (data.percentage !== undefined) {
    const percentColor = data.percentage > 70 ? "text-orange-600" : 
                       data.percentage > 40 ? "text-yellow-600" : "text-emerald-600";
    const sizeInfo = data.originalLength && !isMobile ? ` (${data.summaryLength}/${data.originalLength} ký tự)` : "";
    const translatedText = data.translated ? ` • 🌐 Đã dịch` : "";
    const fallbackText = data.fallback ? ` • ⚠️ Tóm tắt từ bản lưu` : "";
    const timeoutText = data.fallbackReason === 'timeout' ? ` • ⏱️ Kết nối chậm` : "";
    
    elements.modalSource.innerHTML = `
      <span>Nguồn: ${item.sourceName || ""}</span>
      <span class="${percentColor} ml-2">${data.percentage}%${sizeInfo}</span>
      ${translatedText}
      ${fallbackText}
      ${timeoutText}
    `;
  } else {
    elements.modalSource.textContent = `Nguồn: ${item.sourceName || ""}`;
  }
  
  // Show warning if using fallback due to timeout
  if (data.fallbackReason === 'timeout') {
    const warningNotice = `
      <div class="mb-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm">
        <p class="font-bold">⏱️ Kết nối chậm</p>
        <p>Đang hiển thị tóm tắt có sẵn do kết nối mạng chậm.</p>
      </div>
    `;
    elements.summaryList.innerHTML = warningNotice;
  } else if (data.error && data.bullets) {
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

// Render summary content with proper formatting
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

// Render paragraph-based summary
function renderParagraphSummary(paragraphs, animationClass) {
  return paragraphs.map((paragraph, index) => `
    <div class="mb-3 p-3 bg-white/60 rounded-lg border-l-4 border-emerald-500 ${animationClass}" 
         style="animation-delay: ${index * 0.1}s">
      <p class="text-gray-800 leading-relaxed text-base sm:text-lg">${paragraph}</p>
    </div>
  `).join('');
}

// Render bullet-based summary
function renderBulletSummary(bullets, animationClass) {
  return bullets.map((bullet, index) => `
    <div class="mb-2 p-3 bg-white/50 rounded-lg border-l-4 border-emerald-500 ${animationClass}"
         style="animation-delay: ${index * 0.1}s">
      <p class="text-gray-800 leading-relaxed text-base sm:text-lg">${bullet}</p>
    </div>
  `).join('');
}

// Show timeout fallback
function showTimeoutFallback(item, isMobile) {
  const retryMessage = isMobile ? 
    "Kết nối mạng chậm. Thời gian chờ đã hết (30 giây)." :
    "Tải nội dung mất quá nhiều thời gian (45 giây).";
  
  const html = `
    <div class="text-center py-8">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="text-lg text-gray-600 mb-2">Kết nối quá chậm</p>
      <p class="text-sm text-gray-500 mb-4">${retryMessage}</p>
      
      ${item.summary ? `
        <div class="text-left bg-white/50 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-600 mb-2">📄 Tóm tắt có sẵn:</p>
          <p class="text-gray-800">${item.summary}</p>
        </div>
      ` : ''}
      
      <div class="text-xs text-gray-500 mb-4">
        💡 Mẹo: Hãy thử lại với kết nối WiFi ổn định hơn
      </div>
      
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

// Show error fallback with helpful message
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