// Card rendering functions

import { timeAgo } from './utils.js';
import { isRead, toggleReadStatus, markRead } from './read-status.js';
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
  
  // Format summary content with length limit
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
           class="article-link flex-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-center">
          Link bài báo
        </a>
      </div>
    </div>
  `;
  
  // Add event listeners với logic phân biệt click và select
  attachCardEventListeners(card, item);
  
  return card;
}

// Utility function to truncate text at word boundary
function truncateAtWordBoundary(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  
  // Find last space within the limit
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If we found a space and it's not too close to the beginning
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  // Otherwise, just cut at the limit
  return truncated + '...';
}

// Calculate total content length (text only, no HTML)
function calculateContentLength(content) {
  // Remove HTML tags and calculate text length
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return textContent.length;
}

function formatSummaryContent(item) {
  const MAX_CONTENT_LENGTH = 550;
  
  if (item.bullets && Array.isArray(item.bullets) && item.bullets.length > 0) {
    // Process bullets with length limit
    const processedBullets = [];
    let totalLength = 0;
    
    for (const bullet of item.bullets) {
      const cleanBullet = bullet.replace(/^[•▸◦‣⁃]\s*/, '');
      
      // Estimate the length contribution of this bullet (including HTML)
      const bulletTextLength = cleanBullet.length + 2; // +2 for bullet point and space
      
      if (totalLength + bulletTextLength <= MAX_CONTENT_LENGTH) {
        processedBullets.push(cleanBullet);
        totalLength += bulletTextLength;
      } else {
        // If we can fit a truncated version of this bullet
        const remainingLength = MAX_CONTENT_LENGTH - totalLength - 3; // -3 for "..."
        if (remainingLength > 50) { // Only add if meaningful content can fit
          const truncatedBullet = truncateAtWordBoundary(cleanBullet, remainingLength);
          processedBullets.push(truncatedBullet);
        }
        break;
      }
    }
    
    // If no bullets fit or we have very short content, fallback to summary
    if (processedBullets.length === 0 || totalLength < 100) {
      return formatFallbackSummary(item.summary || "Không có tóm tắt.", MAX_CONTENT_LENGTH);
    }
    
    return `
      <ul class="text-base text-gray-700 space-y-2 list-none pl-0">
        ${processedBullets.map(bullet => `
          <li class="flex items-start gap-2">
            <span class="text-gray-500 mt-0.5 flex-shrink-0 no-select">•</span>
            <span class="leading-relaxed flex-1">${bullet}</span>
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    // Handle regular summary
    return formatFallbackSummary(item.summary || "Không có tóm tắt.", MAX_CONTENT_LENGTH);
  }
}

function formatFallbackSummary(summary, maxLength) {
  const truncatedSummary = truncateAtWordBoundary(summary, maxLength);
  
  return `
    <p class="text-base text-gray-700 line-clamp-7 leading-relaxed">
      ${truncatedSummary}
    </p>
  `;
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
  
  // Click vào link bài báo - ĐÁNH DẤU ĐÃ ĐỌC
  const articleLink = card.querySelector('.article-link');
  articleLink.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Đánh dấu đã đọc khi click vào link
    if (!isRead(item.link)) {
      markRead(item.link);
      
      // Update UI ngay lập tức
      card.classList.add("opacity-60", "read");
      
      const statusBtn = card.querySelector('.read-status-btn');
      if (statusBtn) {
        statusBtn.innerHTML = '✅ Đã đọc';
        statusBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        statusBtn.classList.add('bg-green-600', 'hover:bg-green-500');
      }
    }
    
    // Link vẫn mở bình thường (không preventDefault)
  });
}