// Modal management with auto-resize title and swipe-to-close (UP & LEFT)
// File: public/js/modules/modal.js

import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { markRead } from './read-status.js';
import { loadSummary } from './summary-loader.js';
import { resetTTS } from './tts.js';
import { openAISummary } from './ai.js';

// === Context menu for summary paragraphs (translate / copy) ===

// Inject highlight style once
(function addLongPressStyles(){
  if (document.getElementById('longpress-style')) return;
  const st = document.createElement('style');
  st.id = 'longpress-style';
  st.textContent = `.pressed-highlight{ background: #FEF3C7; color: #111827; }`;
  document.head.appendChild(st);
})();

let ctxMenuEl = null;
function ensureContextMenu() {
  if (ctxMenuEl) return ctxMenuEl;
  ctxMenuEl = document.createElement('div');
  ctxMenuEl.id = 'summaryContextMenu';
  ctxMenuEl.className = 'fixed z-[9999] bg-white border border-gray-400 rounded-lg shadow-lg text-sm text-gray-900';
  ctxMenuEl.style.display = 'none';
  ctxMenuEl.innerHTML = `
    <button data-action="translate" class="block w-full text-left px-3 py-2 hover:bg-gray-100">Dịch đoạn này</button>
    <button data-action="copy" class="block w-full text-left px-3 py-2 hover:bg-gray-100">Copy đoạn văn</button>
    <div id="ctxStatus" class="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">&nbsp;</div>
  `;
  document.body.appendChild(ctxMenuEl);
  // Hide when clicking elsewhere
  document.addEventListener('click', () => { ctxMenuEl.style.display='none'; }, true);
  return ctxMenuEl;
}

// Enhanced context menu with "View Original" option and translation cache
function showContextMenuEnhanced(x, y, targetNode, originalTextMap) {
  const menu = ensureContextMenu();
  
  // Static cache for translations (persists across menu opens)
  if (!showContextMenuEnhanced.translationCache) {
    showContextMenuEnhanced.translationCache = new Map();
  }
  const translationCache = showContextMenuEnhanced.translationCache;
  
  // Check if node has been translated
  const isTranslated = targetNode.dataset.translated === 'true';
  const currentText = targetNode.innerText || '';
  
  // Update menu options based on state
  menu.innerHTML = `
    ${isTranslated ? 
      `<button data-action="original" class="block w-full text-left px-3 py-2 hover:bg-gray-100">Xem văn bản gốc</button>` :
      `<button data-action="translate" class="block w-full text-left px-3 py-2 hover:bg-gray-100">Dịch đoạn này</button>`
    }
    <button data-action="copy" class="block w-full text-left px-3 py-2 hover:bg-gray-100">Copy đoạn văn</button>
    <div id="ctxStatus" class="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">&nbsp;</div>
  `;
  
  // Position menu (adjust if near edges)
  const menuWidth = 200;
  const menuHeight = 100;
  
  let menuX = x;
  let menuY = y;
  
  if (menuX + menuWidth > window.innerWidth) {
    menuX = window.innerWidth - menuWidth - 10;
  }
  
  if (menuY + menuHeight > window.innerHeight) {
    menuY = y - menuHeight;
  }
  
  menu.style.left = menuX + 'px';
  menu.style.top = menuY + 'px';
  menu.style.display = 'block';
  
  // Attach handlers
  menu.onclick = async (e) => {
    const act = e.target?.dataset?.action;
    if (!act) return;
    e.stopPropagation();
    
    const status = menu.querySelector('#ctxStatus');
    
    if (act === 'copy') {
      try { 
        await navigator.clipboard.writeText(currentText); 
        if (status) status.textContent = 'Đã copy';
      } catch { 
        if (status) status.textContent = 'Copy thất bại';
      }
      setTimeout(() => {
        menu.style.display = 'none';
        if (status) status.textContent = '';
        targetNode?.classList.remove('pressed-highlight');
      }, 600);
      return;
    }
    
    if (act === 'translate') {
      try {
        // Store original text before translating
        if (!originalTextMap.has(targetNode)) {
          originalTextMap.set(targetNode, currentText);
        }
        
        const originalText = originalTextMap.get(targetNode) || currentText;
        
        // Check if we already have translation cached
        let translated = translationCache.get(originalText);
        
        if (translated) {
          // Use cached translation
          if (status) status.textContent = 'Đang dịch (cache)...';
          targetNode.innerText = translated;
          targetNode.dataset.translated = 'true';
          if (status) status.textContent = 'Đã dịch (từ cache)';
        } else {
          // Fetch new translation
          if (status) status.textContent = 'Đang dịch...';
          
          const { translateToVietnamese } = await import('./translator.js');
          translated = await translateToVietnamese(originalText);
          
          if (translated && translated !== originalText) {
            // Cache the translation
            translationCache.set(originalText, translated);
            
            targetNode.innerText = translated;
            targetNode.dataset.translated = 'true';
            if (status) status.textContent = 'Đã dịch';
          } else {
            if (status) status.textContent = 'Không thể dịch';
          }
        }
      } catch {
        if (status) status.textContent = 'Lỗi dịch';
      }
      
      setTimeout(() => {
        menu.style.display = 'none';
        if (status) status.textContent = '';
        targetNode?.classList.remove('pressed-highlight');
      }, 700);
      return;
    }
    
    if (act === 'original') {
      // Restore original text
      const original = originalTextMap.get(targetNode);
      if (original) {
        targetNode.innerText = original;
        targetNode.dataset.translated = 'false';
        if (status) status.textContent = 'Đã khôi phục';
      }
      setTimeout(() => {
        menu.style.display = 'none';
        if (status) status.textContent = '';
        targetNode?.classList.remove('pressed-highlight');
      }, 600);
      return;
    }
  };
}

// Setup click/tap detection on summaryList
function setupSummaryLongPress() {
  const container = elements.summaryList;
  if (!container) return;

  let selectedNode = null;
  let originalText = new Map();
  
  // Variables for tap detection
  let tapStartTime = 0;
  let tapStartX = 0;
  let tapStartY = 0;
  let isTapping = false;

  const handleTapStart = (e) => {
    // Get coordinates
    const point = e.touches ? e.touches[0] : e;
    tapStartX = point.clientX;
    tapStartY = point.clientY;
    tapStartTime = Date.now();
    isTapping = true;
  };

  const handleTapEnd = (e) => {
    if (!isTapping) return;
    
    // Check if it was a quick tap (not a long press or drag)
    const tapDuration = Date.now() - tapStartTime;
    const point = e.changedTouches ? e.changedTouches[0] : e;
    const moveX = Math.abs(point.clientX - tapStartX);
    const moveY = Math.abs(point.clientY - tapStartY);
    
    // Only show menu if:
    // - Tap was quick (< 300ms)
    // - Finger didn't move much (< 10px)
    if (tapDuration < 300 && moveX < 10 && moveY < 10) {
      // Find the text element
      const target = e.target;
      let node = null;
      
      if (target.tagName === 'P' || target.tagName === 'LI' || 
          (target.tagName === 'SPAN' && target.innerText && target.innerText.length > 0)) {
        node = target;
      } else if (target.parentElement) {
        const parent = target.parentElement;
        if (parent.tagName === 'P' || parent.tagName === 'LI') {
          node = parent;
        }
      }
      
      if (node) {
        // Remove previous highlight
        if (selectedNode && selectedNode !== node) {
          selectedNode.classList.remove('pressed-highlight');
        }
        
        selectedNode = node;
        selectedNode.classList.add('pressed-highlight');
        
        // Show context menu
        showContextMenuEnhanced(point.clientX, point.clientY, selectedNode, originalText);
        
        e.preventDefault();
        e.stopPropagation();
      }
    }
    
    isTapping = false;
  };

  // Touch events
  container.addEventListener('touchstart', handleTapStart, { passive: true });
  container.addEventListener('touchend', handleTapEnd, { passive: false });
  
  // Mouse events (for desktop)
  container.addEventListener('mousedown', handleTapStart);
  container.addEventListener('mouseup', (e) => {
    // Only handle left click
    if (e.button === 0) {
      handleTapEnd(e);
    }
  });
  
  // Hide menu when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#summaryContextMenu') && !e.target.closest('#summaryList')) {
      const menu = document.getElementById('summaryContextMenu');
      if (menu) menu.style.display = 'none';
      if (selectedNode) {
        selectedNode.classList.remove('pressed-highlight');
        selectedNode = null;
      }
    }
  }, true);
}

// === End context menu section ===

// Swipe handler variables
let touchStartY = 0;
let touchEndY = 0;
let touchStartX = 0;
let touchEndX = 0;
let isDragging = false;
let modalPanel = null;
let canDrag = false;

// New variables for swipe left detection
let isSwipingHorizontal = false;
let swipeDirection = null;
const SWIPE_LEFT_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 100;
const SWIPE_ANGLE_THRESHOLD = 30;

// Prevent body scroll when modal is open
function preventBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  document.body.dataset.scrollY = scrollY;
  document.body.classList.add('modal-open');
}

// Restore body scroll when modal closes
function restoreBodyScroll() {
  const scrollY = document.body.dataset.scrollY || 0;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  document.body.classList.remove('modal-open');
  window.scrollTo(0, parseInt(scrollY));
  delete document.body.dataset.scrollY;
}

// Auto-resize title based on length
function autoResizeTitle(title) {
  if (!elements.modalTitle) return;
  
  const titleLength = title ? title.length : 0;
  
  elements.modalTitle.classList.remove('title-long', 'title-very-long', 'title-extra-long');
  
  if (titleLength > 150) {
    elements.modalTitle.classList.add('title-extra-long');
  } else if (titleLength > 100) {
    elements.modalTitle.classList.add('title-very-long');
  } else if (titleLength > 60) {
    elements.modalTitle.classList.add('title-long');
  }
}

// Helper to calculate swipe angle
function getSwipeAngle(deltaX, deltaY) {
  return Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
}

// Add swipe indicator HTML to modal
function addSwipeIndicators() {
  if (!modalPanel) return;
  
  if (modalPanel.querySelector('.modal-swipe-indicator')) return;
  
  const leftIndicator = document.createElement('div');
  leftIndicator.className = 'modal-swipe-indicator modal-swipe-left-indicator';
  leftIndicator.innerHTML = `
    <div class="swipe-indicator-bg"></div>
    <div class="swipe-indicator-content">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      <span>Đóng</span>
    </div>
  `;
  modalPanel.appendChild(leftIndicator);
  
  const upIndicator = document.createElement('div');
  upIndicator.className = 'modal-swipe-indicator modal-swipe-up-indicator';
  upIndicator.innerHTML = `
    <div class="swipe-indicator-bg"></div>
    <div class="swipe-indicator-content">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
      </svg>
      <span>Đóng</span>
    </div>
  `;
  modalPanel.appendChild(upIndicator);
}

// Show/hide swipe indicators with progress
function updateSwipeIndicator(direction, progress) {
  if (!modalPanel) return;
  
  const leftIndicator = modalPanel.querySelector('.modal-swipe-left-indicator');
  const upIndicator = modalPanel.querySelector('.modal-swipe-up-indicator');
  
  if (leftIndicator) leftIndicator.style.opacity = '0';
  if (upIndicator) upIndicator.style.opacity = '0';
  
  if (direction === 'left' && leftIndicator) {
    leftIndicator.style.opacity = Math.min(1, progress);
    const bg = leftIndicator.querySelector('.swipe-indicator-bg');
    if (bg) {
      if (progress < 0.5) {
        bg.className = 'swipe-indicator-bg bg-blue-500';
      } else if (progress < 1) {
        bg.className = 'swipe-indicator-bg bg-blue-600';
      } else {
        bg.className = 'swipe-indicator-bg bg-red-600';
      }
    }
  } else if (direction === 'up' && upIndicator) {
    upIndicator.style.opacity = Math.min(1, progress);
    const bg = upIndicator.querySelector('.swipe-indicator-bg');
    if (bg) {
      if (progress < 0.5) {
        bg.className = 'swipe-indicator-bg bg-blue-500';
      } else if (progress < 1) {
        bg.className = 'swipe-indicator-bg bg-blue-600';
      } else {
        bg.className = 'swipe-indicator-bg bg-red-600';
      }
    }
  }
}

// Initialize swipe handlers
function initSwipeHandlers() {
  modalPanel = elements.modalPanel;
  if (!modalPanel) return;
  
  addSwipeIndicators();
  
  if (!document.getElementById('dragHandle')) {
    const dragHandle = document.createElement('div');
    dragHandle.id = 'dragHandle';
    dragHandle.className = 'drag-handle';
    modalPanel.insertBefore(dragHandle, modalPanel.firstChild);
  }
  
  const dragHandle = document.getElementById('dragHandle');
  const modalFooter = modalPanel.querySelector('.border-t.border-gray-300.pt-2');
  
  let footerDragZone = null;
  if (modalFooter) {
    footerDragZone = modalFooter.querySelector('.footer-drag-zone');
    if (!footerDragZone) {
      footerDragZone = document.createElement('div');
      footerDragZone.className = 'footer-drag-zone';
      modalFooter.insertBefore(footerDragZone, modalFooter.firstChild);
    }
  }
  
  modalPanel.addEventListener('touchstart', handleModalTouchStart, { passive: false });
  modalPanel.addEventListener('touchmove', handleModalTouchMove, { passive: false });
  modalPanel.addEventListener('touchend', handleModalTouchEnd, { passive: false });
  
  modalPanel.addEventListener('mousedown', handleModalMouseDown);
  modalPanel.addEventListener('mousemove', handleModalMouseMove);
  modalPanel.addEventListener('mouseup', handleModalMouseUp);
  
  if (dragHandle) {
    dragHandle.addEventListener('touchstart', handleDragHandleTouchStart, { passive: false });
    dragHandle.addEventListener('mousedown', handleDragHandleMouseDown);
  }
  
  if (modalFooter) {
    const _footerTarget = modalFooter.querySelector('.footer-drag-zone') || modalFooter;
    _footerTarget.addEventListener('touchstart', handleFooterTouchStart, { passive: false });
    _footerTarget.addEventListener('mousedown', handleFooterMouseDown);
    
    if (!modalFooter.querySelector('.footer-drag-hint')) {
      const footerHint = document.createElement('div');
      footerHint.className = 'footer-drag-hint';
      footerHint.innerHTML = `<div class="footer-drag-indicator"></div>`;
      modalFooter.appendChild(footerHint);
    }
  }
}

// Handle modal touch start
function handleModalTouchStart(e) {
  if (e.target && (e.target.id === 'modalClose' || (e.target.closest && e.target.closest('#modalClose')))) { return; }
  if (e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('input') ||
      e.target.closest('select') ||
      e.target.closest('#summaryArea')) {
    return;
  }
  
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;
  isSwipingHorizontal = false;
  swipeDirection = null;
}

// Handle modal touch move
function handleModalTouchMove(e) {
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
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 20 && angle < SWIPE_ANGLE_THRESHOLD) {
      swipeDirection = 'left';
      isSwipingHorizontal = true;
      e.preventDefault();
      
      const progress = Math.min(1, deltaX / SWIPE_LEFT_THRESHOLD);
      animateModalSwipe('left', -deltaX, progress);
      updateSwipeIndicator('left', progress);
    }
  } else {
    if (deltaY > 20) {
      swipeDirection = 'up';
      isSwipingHorizontal = false;
      e.preventDefault();
      
      const progress = Math.min(1, deltaY / SWIPE_UP_THRESHOLD);
      animateModalSwipe('up', -deltaY, progress);
      updateSwipeIndicator('up', progress);
    }
  }
}

// Handle modal touch end
function handleModalTouchEnd(e) {
  if (!touchStartX || !touchStartY) return;
  
  const deltaX = touchStartX - touchEndX;
  const deltaY = touchStartY - touchEndY;
  
  if (swipeDirection === 'left' && deltaX > SWIPE_LEFT_THRESHOLD) {
    animateModalClose('left');
  } else if (swipeDirection === 'up' && deltaY > SWIPE_UP_THRESHOLD) {
    animateModalClose('up');
  } else {
    resetModalPosition();
  }
  
  touchStartX = 0;
  touchStartY = 0;
  touchEndX = 0;
  touchEndY = 0;
  isSwipingHorizontal = false;
  swipeDirection = null;
}

// Mouse events for desktop testing
function handleModalMouseDown(e) {
  if (e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('#summaryArea')) {
    return;
  }
  
  touchStartX = e.clientX;
  touchStartY = e.clientY;
  touchEndX = e.clientX;
  touchEndY = e.clientY;
  isSwipingHorizontal = false;
  swipeDirection = null;
}

function handleModalMouseMove(e) {
  if (!touchStartX) return;
  
  touchEndX = e.clientX;
  touchEndY = e.clientY;
  
  const deltaX = touchStartX - touchEndX;
  const deltaY = touchStartY - touchEndY;
  
  if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 20) {
    swipeDirection = 'left';
    const progress = Math.min(1, deltaX / SWIPE_LEFT_THRESHOLD);
    animateModalSwipe('left', -deltaX, progress);
    updateSwipeIndicator('left', progress);
  }
}

function handleModalMouseUp(e) {
  if (!touchStartX) return;
  
  const deltaX = touchStartX - touchEndX;
  
  if (swipeDirection === 'left' && deltaX > SWIPE_LEFT_THRESHOLD) {
    animateModalClose('left');
  } else {
    resetModalPosition();
  }
  
  touchStartX = 0;
  touchStartY = 0;
  swipeDirection = null;
}

// Animate modal during swipe
function animateModalSwipe(direction, delta, progress) {
  if (!modalPanel) return;
  
  modalPanel.style.transition = 'none';
  
  if (direction === 'left') {
    const translateX = Math.min(150, Math.abs(delta));
    const rotate = translateX * 0.05;
    const scale = 1 - (progress * 0.05);
    
    modalPanel.style.transform = `translateX(${-translateX}px) rotate(${-rotate}deg) scale(${scale})`;
    modalPanel.style.opacity = 1 - (progress * 0.3);
  } else if (direction === 'up') {
    const translateY = Math.min(200, Math.abs(delta));
    modalPanel.style.transform = `translateY(${-translateY}px)`;
    modalPanel.style.opacity = 1 - (progress * 0.5);
  }
}

// Animate modal close
function animateModalClose(direction) {
  if (!modalPanel) return;
  
  modalPanel.style.transition = 'all 0.3s ease-out';
  
  if (direction === 'left') {
    modalPanel.style.transform = 'translateX(-100%) rotate(-10deg) scale(0.9)';
    modalPanel.style.opacity = '0';
  } else if (direction === 'up') {
    modalPanel.style.transform = 'translateY(-100%)';
    modalPanel.style.opacity = '0';
  }
  
  setTimeout(() => {
    closeModal();
  }, 300);
}

// Reset modal position
function resetModalPosition() {
  if (!modalPanel) return;
  
  modalPanel.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  modalPanel.style.transform = '';
  modalPanel.style.opacity = '';
  
  updateSwipeIndicator(null, 0);
}

// Handle drag handle touch start
function handleDragHandleTouchStart(e) {
  if (e.target && (e.target.id === 'modalClose' || (e.target.closest && e.target.closest('#modalClose')))) { return; }
  const touch = e.touches[0];
  touchStartY = touch.clientY;
  isDragging = true;
  canDrag = true;
  modalPanel.style.transition = 'none';
  modalPanel.classList.add('dragging');
  e.preventDefault();
  e.stopPropagation();
}

// Handle drag handle mouse down
function handleDragHandleMouseDown(e) {
  touchStartY = e.clientY;
  isDragging = true;
  canDrag = true;
  modalPanel.style.transition = 'none';
  modalPanel.classList.add('dragging');
  e.preventDefault();
}

// Handle footer touch start
function handleFooterTouchStart(e) {
  const touch = e.touches[0];
  const target = e.target;
  
  if (target.closest('button') || 
      target.closest('a') || 
      target.closest('input') ||
      target.closest('select')) {
    return;
  }
  
  touchStartY = touch.clientY;
  isDragging = true;
  canDrag = true;
  modalPanel.style.transition = 'none';
  modalPanel.classList.add('dragging');
  
  const footerHint = modalPanel.querySelector('.footer-drag-hint');
  if (footerHint) {
    footerHint.classList.add('active');
  }
  
  e.preventDefault();
  e.stopPropagation();
}

// Handle footer mouse down
function handleFooterMouseDown(e) {
  const target = e.target;
  
  if (target.closest('button') || 
      target.closest('a') || 
      target.closest('input')) {
    return;
  }
  
  touchStartY = e.clientY;
  isDragging = true;
  canDrag = true;
  modalPanel.style.transition = 'none';
  modalPanel.classList.add('dragging');
  
  const footerHint = modalPanel.querySelector('.footer-drag-hint');
  if (footerHint) {
    footerHint.classList.add('active');
  }
  
  e.preventDefault();
}

// Global touch move
function handleGlobalTouchMove(e) {
  if (!isDragging || !canDrag) return;
  
  const touch = e.touches[0];
  const deltaY = touchStartY - touch.clientY;
  
  if (deltaY > 0) {
    const translateY = Math.min(0, -deltaY * 0.5);
    modalPanel.style.transform = `translateY(${translateY}px)`;
    const opacity = Math.max(0.3, 1 - (deltaY / 500));
    modalPanel.style.opacity = opacity;
    e.preventDefault();
  } else if (deltaY < -10) {
    const translateY = Math.min(30, Math.abs(deltaY) * 0.1);
    modalPanel.style.transform = `translateY(${translateY}px)`;
    e.preventDefault();
  }
  
  touchEndY = touch.clientY;
}

// Global mouse move
function handleGlobalMouseMove(e) {
  if (!isDragging || !canDrag) return;
  
  const deltaY = touchStartY - e.clientY;
  
  if (deltaY > 0) {
    const translateY = Math.min(0, -deltaY * 0.5);
    modalPanel.style.transform = `translateY(${translateY}px)`;
    const opacity = Math.max(0.3, 1 - (deltaY / 500));
    modalPanel.style.opacity = opacity;
  } else {
    const translateY = Math.min(30, Math.abs(deltaY) * 0.1);
    modalPanel.style.transform = `translateY(${translateY}px)`;
  }
  
  touchEndY = e.clientY;
}

// Global touch end
function handleGlobalTouchEnd(e) {
  if (isDragging && canDrag) {
    finishDrag();
  }
}

// Global mouse up
function handleGlobalMouseUp(e) {
  if (isDragging && canDrag) {
    finishDrag();
  }
}

// Finish drag
function finishDrag() {
  isDragging = false;
  canDrag = false;
  modalPanel.classList.remove('dragging');
  
  const footerHint = modalPanel.querySelector('.footer-drag-hint');
  if (footerHint) {
    footerHint.classList.remove('active');
  }
  
  const swipeDistance = touchStartY - touchEndY;
  const swipeVelocity = Math.abs(swipeDistance);
  
  if (swipeDistance > 120 || (swipeDistance > 80 && swipeVelocity > 120)) {
    modalPanel.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    modalPanel.style.transform = 'translateY(-100%)';
    modalPanel.style.opacity = '0';
    
    setTimeout(() => {
      closeModal();
    }, 300);
  } else {
    modalPanel.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    modalPanel.style.transform = 'translateY(0)';
    modalPanel.style.opacity = '1';
  }
  
  touchStartY = 0;
  touchEndY = 0;
}

// Clean up handlers
function cleanupSwipeHandlers() {
  const dragHandle = document.getElementById('dragHandle');
  const modalFooter = modalPanel?.querySelector('.border-t.border-gray-300.pt-2');
  
  if (modalPanel) {
    modalPanel.removeEventListener('touchstart', handleModalTouchStart);
    modalPanel.removeEventListener('touchmove', handleModalTouchMove);
    modalPanel.removeEventListener('touchend', handleModalTouchEnd);
    modalPanel.removeEventListener('mousedown', handleModalMouseDown);
    modalPanel.removeEventListener('mousemove', handleModalMouseMove);
    modalPanel.removeEventListener('mouseup', handleModalMouseUp);
  }
  
  if (dragHandle) {
    dragHandle.removeEventListener('touchstart', handleDragHandleTouchStart);
    dragHandle.removeEventListener('mousedown', handleDragHandleMouseDown);
  }
  
  if (modalFooter) {
    const _footerTarget = modalFooter.querySelector('.footer-drag-zone') || modalFooter;
    _footerTarget.removeEventListener('touchstart', handleFooterTouchStart);
    _footerTarget.removeEventListener('mousedown', handleFooterMouseDown);
  }
  
  document.removeEventListener('touchmove', handleGlobalTouchMove);
  document.removeEventListener('touchend', handleGlobalTouchEnd);
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('mouseup', handleGlobalMouseUp);
  
  isDragging = false;
  canDrag = false;
  isSwipingHorizontal = false;
  swipeDirection = null;
}

// Add global event listeners
document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
document.addEventListener('mousemove', handleGlobalMouseMove);
document.addEventListener('mouseup', handleGlobalMouseUp);

// Strengthen close button interactions
if (elements.modalClose) {
  const _closeImmediate = (ev) => {
    try { ev.stopPropagation(); } catch {}
    try { ev.preventDefault(); } catch {}
    closeModal();
  };
  elements.modalClose.addEventListener('click', _closeImmediate, true);
  elements.modalClose.addEventListener('touchend', _closeImmediate, { capture: true, passive: false });
}

export function openSummaryModal(item, link) {
  updateState({ 
    currentModalLink: link,
    currentItem: item 
  });
  
  const title = item?.title || "Tóm tắt";
  elements.modalTitle.textContent = title;
  autoResizeTitle(title);
  
  elements.modalSource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  elements.modalOpenLink.href = link;

  if (elements.modalAIBtn) {
    elements.modalAIBtn.onclick = (e) => {
      e?.stopPropagation?.();
      openAISummary(item?.title || '', link);
    };
  }

  resetModalUI();
  loadSummary(item, link);
  markRead(link);

  preventBodyScroll();

  elements.modal.classList.remove("hidden");
  elements.modal.classList.add("flex");
  elements.modal.scrollTop = 0;
  
  if (elements.modalPanel) {
    elements.modalPanel.scrollTop = 0;
    elements.modalPanel.style.transform = '';
    elements.modalPanel.style.opacity = '';
  }
  
  if (elements.summaryArea) {
    elements.summaryArea.scrollTop = 0;
  }
  
  setTimeout(() => {
    initSwipeHandlers();
    setupSummaryLongPress();
  }, 100);
}

export function closeModal() {
  resetTTS();
  restoreBodyScroll();
  
  cleanupSwipeHandlers();
  
  const indicators = modalPanel?.querySelectorAll('.modal-swipe-indicator');
  if (indicators) {
    indicators.forEach(ind => ind.remove());
  }
  
  if (modalPanel) {
    modalPanel.style.transform = '';
    modalPanel.style.opacity = '';
    modalPanel.style.transition = '';
    modalPanel.classList.remove('dragging');
  }
  
  if (elements.modalTitle) {
    elements.modalTitle.classList.remove('title-long', 'title-very-long', 'title-extra-long');
  }
  
  elements.modal.classList.add("hidden");
  elements.modal.classList.remove("flex");
  
  updateState({ 
    currentItem: null,
    currentModalLink: null 
  });
}

function resetModalUI() {
  elements.summaryLoading.classList.remove("hidden");
  elements.summaryList.classList.add("hidden");
  elements.summaryStats.classList.add("hidden");
  elements.summaryList.innerHTML = "";
  
  resetTTS();
  elements.btnSpeak.classList.add("hidden");
  elements.btnStopSpeak.classList.add("hidden");
  if (elements.ttsRateBox) elements.ttsRateBox.classList.add("hidden");
}

// Copy link button
const copyBtn = document.getElementById('modalCopyLink');
if (copyBtn) {
  copyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const url = elements.modalOpenLink?.href || state.currentModalLink || '';
    if (!url) return;
    try { await navigator.clipboard.writeText(url); 
      copyBtn.textContent = 'Đã copy!';
      setTimeout(()=>{ copyBtn.textContent = 'Copy link'; }, 1200);
    } catch {}
  });
}