// Card rendering functions with SWIPE support

import { timeAgo } from './utils.js';
import { isRead, toggleReadStatus, markRead } from './read-status.js';
import { openSummaryModal } from './modal.js';
import { translateCardElement } from './translator.js';
import { openAISummary } from './ai.js';
import { copyText } from './clipboard.js';

// Auto-resize title based on length
function getTitleClass(title) {
  if (!title) return 'text-xl';
  
  const length = title.length;
  
  if (length > 200) {
    return 'text-xs leading-tight'; // 12px for very long titles
  } else if (length > 150) {
    return 'text-sm leading-snug'; // 14px for long titles  
  } else if (length > 100) {
    return 'text-base leading-snug'; // 16px for medium-long titles
  } else if (length > 70) {
    return 'text-lg leading-snug'; // 18px for medium titles
  } else {
    return 'text-xl leading-snug'; // 20px for short titles (default)
  }
}

export function createCardElement(item) {
  const card = document.createElement('div');
  const readStatus = isRead(item.link);
  
  card.className = `news-card bg-[#ecf0f1] border border-gray-300 rounded-2xl p-4 hover:border-gray-400 transition-colors min-h-[380px] flex flex-col ${readStatus ? "opacity-60 read" : ""}`;
  card.setAttribute('data-url', item.link);
  card.setAttribute('data-title', item.title || '');
  card.setAttribute('data-source', item.sourceName || '');
  
const groupBadge = (() => {
  switch(item.group) {
    case 'vietnameconomic':
      return '<span class="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Kinh tế VN</span>';
    case 'internationaleconomics':
      return '<span class="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Kinh tế QT</span>';
    case 'internationaltech':
      return '<span class="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">Tech QT</span>';
    case 'startuptech':
      return '<span class="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Startup</span>';
    case 'developernews':
      return '<span class="inline-block px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">Dev</span>';
    case 'gamenews':
      return '<span class="inline-block px-2 py-0.5 text-xs bg-pink-100 text-pink-800 rounded">Game</span>';
    case 'designuiux':
      return '<span class="inline-block px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded">Design</span>';
    default:
      return '';
  }
  })();
  
  const readStatusButton = readStatus ? 
    '<button class="read-status-btn px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors">✅ Đã đọc</button>' :
    '<button class="read-status-btn px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">⚪ Bỏ qua</button>';
  
  // Format summary content with length limit
  const summaryContent = formatSummaryContent(item);
  
  // Get dynamic title class based on length
  const titleClass = getTitleClass(item.title);
  
  // Add swipe indicator div
  card.innerHTML = `
    <!-- Swipe indicator (hidden by default) -->
    <div class="swipe-indicator absolute inset-0 pointer-events-none z-20 rounded-2xl opacity-0 transition-opacity duration-200">
      <div class="swipe-indicator-bg absolute inset-0 rounded-2xl"></div>
      <div class="swipe-indicator-icon absolute top-1/2 left-4 transform -translate-y-1/2 text-white">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div class="swipe-indicator-text absolute top-1/2 left-16 transform -translate-y-1/2 text-white font-semibold">
        Đánh dấu đã đọc
      </div>
    </div>
    
    <div class="clickable-content cursor-pointer hover:bg-gray-50 hover:bg-opacity-30 rounded-lg -m-2 p-2 transition-colors flex-1 flex flex-col">
      <h3 class="${titleClass} font-semibold text-gray-900 mb-3 hover:text-emerald-600 transition-colors select-text break-words hyphens-auto">
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
      
      <div class="flex gap-2 items-center flex-nowrap">
        ${readStatusButton}
        <button class="translate-btn px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Dịch</button>
        <button class="ai-summary-btn px-3 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          <span>AI</span>
        </button>
        
        <button class="copy-link-btn p-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg inline-flex items-center justify-center shrink-0" title="Copy link bài báo" aria-label="Copy link">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
<a data-role="open-link" href="${item.link}" target="_blank" rel="noopener" 
           class="article-link px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-center flex-none shrink truncate whitespace-nowrap min-w-0">
          Mở Trang
        </a>
      </div>
    </div>
  `;
  
  // Add event listeners với logic phân biệt click, select và SWIPE
  attachCardEventListeners(card, item);
  
  const aiSummaryBtn = card.querySelector('.ai-summary-btn');
  const copyBtn = card.querySelector('.copy-link-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const href = (item && item.link) ? item.link : (card.querySelector('.article-link')?.href || '');
      if (href) copyText(href);
    });
  }

  if (aiSummaryBtn) {
    aiSummaryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAISummary(item.title || '', item.link);
    });
  }

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
  
  // Variables for text selection and swipe tracking
  let isSelecting = false;
  let mouseDownTime = 0;
  let startX = 0;
  let startY = 0;
  
  // SWIPE DETECTION VARIABLES
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let swipeThreshold = 80;
  let swipeAngleThreshold = 30;
  
  // Helper functions (keep existing helpers)
  function getSwipeAngle(deltaX, deltaY) {
    return Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
  }
  
  function showSwipeIndicator(progress) {
    const indicator = card.querySelector('.swipe-indicator');
    if (!indicator) return;
    const opacity = Math.min(1, progress);
    indicator.style.opacity = opacity;
    const bg = indicator.querySelector('.swipe-indicator-bg');
    if (bg) {
      if (progress < 0.5) {
        bg.className = 'swipe-indicator-bg absolute inset-0 rounded-2xl bg-blue-500';
      } else if (progress < 1) {
        bg.className = 'swipe-indicator-bg absolute inset-0 rounded-2xl bg-blue-600';
      } else {
        bg.className = 'swipe-indicator-bg absolute inset-0 rounded-2xl bg-green-600';
      }
    }
  }
  
  function hideSwipeIndicator() {
    const indicator = card.querySelector('.swipe-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
    }
  }
  
  function animateCardSwipe(deltaX) {
    const maxTranslate = 100;
    const translateX = Math.min(Math.abs(deltaX), maxTranslate) * (deltaX < 0 ? -1 : 1);
    card.style.transition = 'none';
    card.style.transform = `translateX(${translateX}px) rotate(${translateX * 0.02}deg)`;
    card.style.opacity = `${1 - Math.abs(translateX) / 200}`;
  }
  
  function resetCardPosition(animated = true) {
    if (animated) {
      card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    } else {
      card.style.transition = 'none';
    }
    card.style.transform = '';
    card.style.opacity = '';
    hideSwipeIndicator();
  }
  
  // TOUCH EVENTS FOR SWIPE
  card.addEventListener('touchstart', (e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;
    isSwiping = false;
    mouseDownTime = Date.now();
    startX = touch.clientX;
    startY = touch.clientY;
    isSelecting = false;
  }, { passive: true });
  
  card.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) return;
    if (e.target.closest('#summaryArea') || 
        e.target.closest('button') || 
        e.target.closest('a')) {
      return;
    }
    
    const touch = e.touches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    const angle = getSwipeAngle(deltaX, deltaY);
    
    if (Math.abs(deltaX) > 10 && angle < swipeAngleThreshold) {
      isSwiping = true;
      if (deltaX > 0) {
        e.preventDefault();
        const progress = Math.min(1, deltaX / swipeThreshold);
        animateCardSwipe(-deltaX);
        showSwipeIndicator(progress);
      }
    } else if (Math.abs(deltaY) > 10) {
      isSwiping = false;
      resetCardPosition(false);
    }
  }, { passive: false });
  
  card.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    if (isSwiping && deltaX > swipeThreshold) {
      e.preventDefault();
      e.stopPropagation();
      card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      card.style.transform = 'translateX(-100%) rotate(-5deg)';
      card.style.opacity = '0';
      setTimeout(() => {
        toggleReadStatus(item.link);
        resetCardPosition(false);
      }, 300);
    } else {
      resetCardPosition(true);
      const clickDuration = Date.now() - mouseDownTime;
      const moveDistance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
      if (clickDuration < 200 && moveDistance < 10 && !isSwiping) {
        if (e.target.closest('.clickable-content')) {
          e.preventDefault();
          openSummaryModal(item, item.link);
        }
      }
    }
    
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
    isSwiping = false;
  });
  
  // MOUSE EVENTS for desktop
  clickableContent.addEventListener('mousedown', (e) => {
    mouseDownTime = Date.now();
    startX = e.clientX;
    startY = e.clientY;
    isSelecting = false;
  });
  
  clickableContent.addEventListener('mousemove', (e) => {
    if (mouseDownTime > 0) {
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - startX, 2) + 
        Math.pow(e.clientY - startY, 2)
      );
      if (moveDistance > 5) {
        isSelecting = true;
      }
    }
  });
  
  clickableContent.addEventListener('mouseup', (e) => {
    const clickDuration = Date.now() - mouseDownTime;
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().trim().length > 0;
    mouseDownTime = 0;
    
    if (hasSelection || isSelecting) {
      return;
    }
    
    if (clickDuration < 200 && !isSelecting && !isSwiping) {
      e.stopPropagation();
      openSummaryModal(item, item.link);
    }
    
    isSelecting = false;
  });
  
  clickableContent.addEventListener('dblclick', (e) => {
    e.stopPropagation();
  });
  
  // BUTTON EVENT HANDLERS - ATTACH ONLY ONCE
  
  // Read status button
  const readStatusBtn = card.querySelector('.read-status-btn');
  if (readStatusBtn && !readStatusBtn.dataset.listenerAttached) {
    readStatusBtn.dataset.listenerAttached = 'true';
    readStatusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleReadStatus(item.link);
    });
  }
  
  // AI Summary button - ATTACH ONLY ONCE
  const aiSummaryBtn = card.querySelector('.ai-summary-btn');
  if (aiSummaryBtn && !aiSummaryBtn.dataset.listenerAttached) {
    aiSummaryBtn.dataset.listenerAttached = 'true';
    aiSummaryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Stop all other handlers
      
      // Add safety timeout to prevent UI freezing
      setTimeout(() => {
        try {
          openAISummary(item.title || '', item.link);
        } catch (error) {
          console.error('Error opening AI summary:', error);
        }
      }, 0);
    });
  }
  
  // Copy button - ATTACH ONLY ONCE
  const copyBtn = card.querySelector('.copy-link-btn');
  if (copyBtn && !copyBtn.dataset.listenerAttached) {
    copyBtn.dataset.listenerAttached = 'true';
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const href = item.link || card.querySelector('.article-link')?.href || '';
      if (href) {
        copyText(href);
      }
    });
  }
  
  // Translate button - ATTACH ONLY ONCE
  const translateBtn = card.querySelector('.translate-btn');
  if (translateBtn && !translateBtn.dataset.listenerAttached) {
    translateBtn.dataset.listenerAttached = 'true';
    translateBtn.textContent = card.dataset.translated === "true" ? "Bản Gốc" : "Dịch";
    translateBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const translated = card.dataset.translated === "true";
      translateBtn.disabled = true;
      const prev = translateBtn.textContent;
      translateBtn.textContent = translated ? 'Đang hoàn nguyên...' : 'Đang dịch...';
      try {
        if (translated) {
          await translateCardElement(card, { toggleOnly: true });
          translateBtn.textContent = 'Dịch';
        } else {
          await translateCardElement(card);
          translateBtn.textContent = 'Bản Gốc';
        }
      } catch (err) {
        translateBtn.textContent = prev;
        console.warn(err);
      } finally {
        translateBtn.disabled = false;
      }
    });
  }
  
  // Article link - mark as read when clicked
  const articleLink = card.querySelector('.article-link');
  if (articleLink && !articleLink.dataset.listenerAttached) {
    articleLink.dataset.listenerAttached = 'true';
    articleLink.addEventListener('click', (e) => {
      e.stopPropagation();
      // Mark as read when opening article
      // markRead(item.link);
    });
  }
}