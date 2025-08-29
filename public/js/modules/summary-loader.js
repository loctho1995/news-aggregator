// Summary loading logic

import { elements } from './elements.js';
import { ttsSupported } from './tts.js';

export function loadSummary(item, link) {
  const percent = elements.summaryPercent.value || "70";
  
  elements.summaryLoading.textContent = `Đang tóm tắt ${percent}% nội dung...`;
  elements.summaryLoading.classList.remove("hidden");
  elements.summaryList.classList.add("hidden");
  elements.summaryStats.classList.add("hidden");
  
  const url = `/api/summary?url=${encodeURIComponent(link)}&percent=${percent}`;
  
  fetch(url)
    .then(async (r) => {
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      
      updateModalWithSummary(j, item);
      
      if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
    })
    .catch((err) => {
      console.error('Summary error:', err);
      showFallbackSummary(item);
      
      if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
    });
}

function updateModalWithSummary(data, item) {
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
  
  // Enable TTS
  if (ttsSupported()) {
    elements.btnSpeak.classList.remove("hidden");
    elements.btnStopSpeak.classList.remove("hidden");
    if (elements.ttsRateBox) elements.ttsRateBox.classList.remove("hidden");
  }
}

function renderSummaryContent({ bullets, paragraphs, fallbackText }) {
  if (paragraphs && paragraphs.length > 0) {
    return renderParagraphSummary(paragraphs);
  }
  
  if (bullets && bullets.length > 0) {
    return renderBulletSummary(bullets);
  }
  
  return fallbackText ? 
    `<p class="text-gray-700 text-lg">${fallbackText}</p>` : 
    `<p class="text-gray-500 italic text-lg">Không có nội dung tóm tắt.</p>`;
}

function renderParagraphSummary(paragraphs) {
  return paragraphs.map((paragraph) => `
    <div class="mb-4 p-4 bg-white/60 rounded-lg border-l-4 border-emerald-500 hover:bg-white/80 transition-colors">
      <p class="text-gray-800 leading-relaxed text-lg">${paragraph}</p>
    </div>
  `).join('');
}

function renderBulletSummary(bullets) {
  return bullets.map(bullet => `
    <div class="mb-3 p-4 bg-white/50 rounded-lg border-l-4 border-emerald-500">
      <p class="text-gray-800 leading-relaxed text-lg">${bullet}</p>
    </div>
  `).join('');
}

function showFallbackSummary(item) {
  const html = renderSummaryContent({
    paragraphs: null,
    bullets: [],
    fallbackText: item.summary || "Không thể tải tóm tắt.",
  });
  
  elements.summaryList.innerHTML = html;
  elements.summaryLoading.classList.add("hidden");
  elements.summaryList.classList.remove("hidden");
  
  if (ttsSupported()) {
    elements.btnSpeak.classList.remove("hidden");
    elements.btnStopSpeak.classList.remove("hidden");
    if (elements.ttsRateBox) elements.ttsRateBox.classList.remove("hidden");
  }
}