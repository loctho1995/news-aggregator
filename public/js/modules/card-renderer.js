// Card rendering functions with SWIPE support

import { timeAgo } from './utils.js';
import { isRead, toggleReadStatus, markRead } from './read-status.js';
import { openSummaryModal } from './modal.js';
import { translateCardElement } from './translator.js';
import { openAISummary } from './ai.js';

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
      
      <div class="flex gap-2 flex-wrap">
        ${readStatusButton}
        <button class="translate-btn px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Dịch</button>
        <button class="ai-summary-btn px-3 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          <span>AI</span>
        </button>
        <a href="${item.link}" target="_blank" rel="noopener" 
           class="article-link flex-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-center">
          Link bài báo
        </a>
      </div>
    </div>
  `;
  
  // Add event listeners với logic phân biệt click, select và SWIPE
  attachCardEventListeners(card, item);
  
  const aiSummaryBtn = card.querySelector('.ai-summary-btn');
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
  
  // Biến để track text selection và swipe
  let isSelecting = false;
  let mouseDownTime = 0;
  let startX = 0;
  let startY = 0;
  
  // SWIPE DETECTION VARIABLES
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let swipeThreshold = 80; // pixels needed to trigger swipe
  let swipeAngleThreshold = 30; // degrees - max angle for horizontal swipe
  
  // Helper to calculate swipe angle
  function getSwipeAngle(deltaX, deltaY) {
    return Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
  }
  
  // Helper to show swipe indicator
  function showSwipeIndicator(progress) {
    const indicator = card.querySelector('.swipe-indicator');
    if (!indicator) return;
    
    // Calculate opacity based on progress (0 to 1)
    const opacity = Math.min(1, progress);
    indicator.style.opacity = opacity;
    
    // Change background color based on progress
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
  
  // Helper to hide swipe indicator
  function hideSwipeIndicator() {
    const indicator = card.querySelector('.swipe-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
    }
  }
  
  // Helper to animate card swipe
  function animateCardSwipe(deltaX) {
    // Limit the translation to prevent card from moving too far
    const maxTranslate = 100;
    const translateX = Math.min(Math.abs(deltaX), maxTranslate) * (deltaX < 0 ? -1 : 1);
    
    card.style.transition = 'none';
    card.style.transform = `translateX(${translateX}px) rotate(${translateX * 0.02}deg)`;
    card.style.opacity = `${1 - Math.abs(translateX) / 200}`;
  }
  
  // Helper to reset card position
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
    // Don't interfere with buttons or links
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSwiping = false;
    
    // Also track for click detection
    mouseDownTime = Date.now();
    startX = touch.clientX;
    startY = touch.clientY;
    isSelecting = false;
  }, { passive: true });
  
  card.addEventListener('touchmove', (e) => {
    if (!touchStartX) return;
    
    const touch = e.touches[0];
    const deltaX = touchStartX - touch.clientX;
    const deltaY = touchStartY - touch.clientY;
    
    // Calculate swipe angle
    const angle = getSwipeAngle(deltaX, deltaY);
    
    // Check if this is a horizontal swipe (within angle threshold)
    if (Math.abs(deltaX) > 10 && angle < swipeAngleThreshold) {
      isSwiping = true;
      
      // Only handle left swipes
      if (deltaX > 0) {
        e.preventDefault(); // Prevent scrolling
        
        // Calculate progress (0 to 1)
        const progress = Math.min(1, deltaX / swipeThreshold);
        
        // Show visual feedback
        animateCardSwipe(-deltaX);
        showSwipeIndicator(progress);
      }
    } else if (Math.abs(deltaY) > 10) {
      // Vertical movement - likely scrolling
      isSwiping = false;
      resetCardPosition(false);
    }
  }, { passive: false });
  
  card.addEventListener('touchend', (e) => {
    if (!touchStartX) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    // Check if this was a swipe
    if (isSwiping && deltaX > swipeThreshold) {
      // Left swipe detected - toggle read status
      e.preventDefault();
      e.stopPropagation();
      
      // Animate completion
      card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      card.style.transform = 'translateX(-100%) rotate(-5deg)';
      card.style.opacity = '0';
      
      // Toggle read status after animation
      setTimeout(() => {
        toggleReadStatus(item.link);
        resetCardPosition(false);
      }, 300);
    } else {
      // Not a valid swipe - reset position
      resetCardPosition(true);
      
      // Check if it was a tap (not swipe, not text selection)
      const clickDuration = Date.now() - mouseDownTime;
      const moveDistance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
      
      if (clickDuration < 200 && moveDistance < 10 && !isSwiping) {
        // It's a tap - check if it's on clickable content
        if (e.target.closest('.clickable-content')) {
          e.preventDefault();
          openSummaryModal(item, item.link);
        }
      }
    }
    
    // Reset
    touchStartX = 0;
    touchStartY = 0;
    isSwiping = false;
  });
  
  // MOUSE EVENTS (for desktop testing)
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
    if (clickDuration < 200 && !isSelecting && !isSwiping) {
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
  
  // Nút AI Summary
  const aiSummaryBtn = card.querySelector('.ai-summary-btn');
  if (aiSummaryBtn) {
    aiSummaryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAISummary(item.title, item.link);
    });
  }
  
  // Nút Dịch/Bản Gốc (toggle + cache)
  const translateBtn = card.querySelector('.translate-btn');
  if (translateBtn) {
    // Set initial label
    translateBtn.textContent = card.dataset.translated === "true" ? "Bản Gốc" : "Dịch";
    translateBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const translated = card.dataset.translated === "true";
      translateBtn.disabled = true;
      const prev = translateBtn.textContent;
      translateBtn.textContent = translated ? 'Đang hoàn nguyên...' : 'Đang dịch...';
      try {
        if (translated) {
          // restore
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

  readStatusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleReadStatus(item.link);
  });
  
  // Click vào link bài báo - ĐÁNH DẤU ĐÃ ĐỌC
  const articleLink = card.querySelector('.article-link');
  articleLink.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}