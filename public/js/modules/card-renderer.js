// Card rendering functions

import { timeAgo } from './utils.js';
import { isRead, toggleReadStatus } from './read-status.js';
import { openSummaryModal } from './modal.js';

export function createCardElement(item) {
  const card = document.createElement('div');
  const readStatus = isRead(item.link);
  
  card.className = `news-card bg-[#ecf0f1] border border-gray-300 rounded-2xl p-4 hover:border-gray-400 transition-colors min-h-[380px] flex flex-col ${readStatus ? "opacity-60 read" : ""}`;
  card.setAttribute('data-url', item.link);
  card.setAttribute('data-title', item.title || '');
  card.setAttribute('data-source', item.sourceName || '');
  
  const groupBadge = item.group === 'internationaleconomics' ? 
    '<span class="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Quốc tế</span>' : '';
  
  const readStatusButton = readStatus ? 
    '<button class="read-status-btn px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors">✅ Đã đọc</button>' :
    '<button class="read-status-btn px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">⚪ Chưa đọc</button>';
  
  // Format summary content
  const summaryContent = formatSummaryContent(item);
  
  card.innerHTML = `
    <div class="clickable-content cursor-pointer hover:bg-gray-50 hover:bg-opacity-30 rounded-lg -m-2 p-2 transition-colors flex-1 flex flex-col">
      <h3 class="text-xl font-semibold text-gray-900 line-clamp-2 leading-snug mb-3 hover:text-emerald-600 transition-colors select-text">
        ${item.title || "Không có tiêu đề"}
      </h3>
      
      <div class="flex-1 select-text">
        ${summaryContent}
      </div>
    </div>
    
    <div class="mt-auto pt-3">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div class="flex items-center gap-2">
          <span class="font-medium text-emerald-600">${item.sourceName || "N/A"}</span>
          ${groupBadge}
          ${item.translated ? '<span class="text-blue-600">Đã dịch</span>' : ''}
        </div>
        <span>${timeAgo(item.publishedAt)}</span>
      </div>
      
      <div class="flex gap-2">
        ${readStatusButton}
        <a href="${item.link}" target="_blank" rel="noopener" 
           class="flex-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-center">
          Link bài báo
        </a>
      </div>
    </div>
  `;
  
  // Add event listeners với logic phân biệt click và select
  attachCardEventListeners(card, item);
  
  return card;
}

function formatSummaryContent(item) {
  if (item.bullets && Array.isArray(item.bullets) && item.bullets.length > 0) {
    return `
      <ul class="text-base text-gray-700 space-y-2 list-none pl-0">
        ${item.bullets.map(bullet => {
          const cleanBullet = bullet.replace(/^[•▸◦‣⁃]\s*/, '');
          return `
            <li class="flex items-start gap-2">
              <span class="text-gray-500 mt-0.5 flex-shrink-0 no-select">•</span>
              <span class="leading-relaxed flex-1">${cleanBullet}</span>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  } else {
    return `
      <p class="text-base text-gray-700 line-clamp-7 leading-relaxed">
        ${item.summary || "Không có tóm tắt."}
      </p>
    `;
  }
}

function attachCardEventListeners(card, item) {
  const clickableContent = card.querySelector('.clickable-content');
  
  // Biến để track text selection
  let isSelecting = false;
  let mouseDownTime = 0;
  let startX = 0;
  let startY = 0;
  
  // Mouse down - bắt đầu track
  clickableContent.addEventListener('mousedown', (e) => {
    mouseDownTime = Date.now();
    startX = e.clientX;
    startY = e.clientY;
    isSelecting = false;
  });
  
  // Mouse move - detect nếu đang select text
  clickableContent.addEventListener('mousemove', (e) => {
    if (mouseDownTime > 0) {
      // Nếu di chuyển chuột > 5px thì coi như đang select
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - startX, 2) + 
        Math.pow(e.clientY - startY, 2)
      );
      
      if (moveDistance > 5) {
        isSelecting = true;
      }
    }
  });
  
  // Mouse up - quyết định action
  clickableContent.addEventListener('mouseup', (e) => {
    const clickDuration = Date.now() - mouseDownTime;
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().trim().length > 0;
    
    // Reset tracking
    mouseDownTime = 0;
    
    // Nếu có text được select hoặc đang trong quá trình select -> không mở modal
    if (hasSelection || isSelecting) {
      return;
    }
    
    // Nếu click nhanh (< 200ms) và không di chuyển -> mở modal
    if (clickDuration < 200 && !isSelecting) {
      e.stopPropagation();
      openSummaryModal(item, item.link);
    }
    
    isSelecting = false;
  });
  
  // Double click để select word
  clickableContent.addEventListener('dblclick', (e) => {
    e.stopPropagation(); // Không mở modal khi double click
  });
  
  // Click vào nút đọc/chưa đọc
  const readStatusBtn = card.querySelector('.read-status-btn');
  readStatusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleReadStatus(item.link);
  });
  
  // Ngăn link bài báo trigger click event của card
  const articleLink = card.querySelector('a[target="_blank"]');
  articleLink.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}