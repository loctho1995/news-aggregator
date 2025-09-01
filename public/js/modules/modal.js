// Modal management with auto-resize title and swipe-to-close (UP & LEFT)
// File: public/js/modules/modal.js

import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { markRead } from './read-status.js';
import { loadSummary } from './summary-loader.js';
import { resetTTS } from './tts.js';

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
const SWIPE_LEFT_THRESHOLD = 100; // pixels needed to trigger left swipe
const SWIPE_UP_THRESHOLD = 100; // pixels needed for up swipe
const SWIPE_ANGLE_THRESHOLD = 30; // max angle deviation for horizontal swipe

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
  
  // Check if indicators already exist
  if (modalPanel.querySelector('.modal-swipe-indicator')) return;
  
  // Add swipe left indicator
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
  
  // Add swipe up indicator (existing one)
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
  
  // Hide all indicators first
  if (leftIndicator) leftIndicator.style.opacity = '0';
  if (upIndicator) upIndicator.style.opacity = '0';
  
  // Show appropriate indicator based on direction
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
  
  // Add swipe indicators
  addSwipeIndicators();
  
  // Add drag handle indicator at top (existing)
  if (!document.getElementById('dragHandle')) {
    const dragHandle = document.createElement('div');
    dragHandle.id = 'dragHandle';
    dragHandle.className = 'drag-handle';
    modalPanel.insertBefore(dragHandle, modalPanel.firstChild);
  }
  
  // Get draggable areas
  const dragHandle = document.getElementById('dragHandle');
  const modalFooter = modalPanel.querySelector('.border-t.border-gray-300.pt-2');
  // Create a dedicated drag zone to avoid hitting buttons/links in the footer
let footerDragZone = null;
if (modalFooter) {
  footerDragZone = modalFooter.querySelector('.footer-drag-zone');
  if (!footerDragZone) {
    footerDragZone = document.createElement('div');
    footerDragZone.className = 'footer-drag-zone';
    // Insert as first child so it's on top of the footer but not covering the content below
    modalFooter.insertBefore(footerDragZone, modalFooter.firstChild);
  }
}
  
  // TOUCH EVENTS FOR ENTIRE MODAL (for swipe detection)
  modalPanel.addEventListener('touchstart', handleModalTouchStart, { passive: false });
  modalPanel.addEventListener('touchmove', handleModalTouchMove, { passive: false });
  modalPanel.addEventListener('touchend', handleModalTouchEnd, { passive: false });
  
  // Mouse events for desktop testing
  modalPanel.addEventListener('mousedown', handleModalMouseDown);
  modalPanel.addEventListener('mousemove', handleModalMouseMove);
  modalPanel.addEventListener('mouseup', handleModalMouseUp);
  
  // Touch events for drag handle (existing)
  if (dragHandle) {
    dragHandle.addEventListener('touchstart', handleDragHandleTouchStart, { passive: false });
    dragHandle.addEventListener('mousedown', handleDragHandleMouseDown);
  }
  
  // Touch events for footer (existing)
  if (modalFooter) {
    const _footerTarget = modalFooter.querySelector('.footer-drag-zone') || modalFooter;
    _footerTarget.addEventListener('touchstart', handleFooterTouchStart, { passive: false });
    _footerTarget.addEventListener('mousedown', handleFooterMouseDown);
    
    // Add visual indicator to footer on mobile
    if (!modalFooter.querySelector('.footer-drag-hint')) {
      const footerHint = document.createElement('div');
      footerHint.className = 'footer-drag-hint';
      footerHint.innerHTML = `<div class="footer-drag-indicator"></div>`;
      modalFooter.appendChild(footerHint);
    }
  }
}

// Handle modal touch start (NEW - for swipe left)
function handleModalTouchStart(e) {
  // Don't interfere with buttons, links, or scrollable content
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

// Handle modal touch move (ENHANCED - for both directions)
function handleModalTouchMove(e) {
  if (!touchStartX || !touchStartY) return;
  
  // Don't track if interacting with content
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
  
  // Determine swipe direction
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (deltaX > 20 && angle < SWIPE_ANGLE_THRESHOLD) {
      // Swiping left
      swipeDirection = 'left';
      isSwipingHorizontal = true;
      e.preventDefault();
      
      // Visual feedback
      const progress = Math.min(1, deltaX / SWIPE_LEFT_THRESHOLD);
      animateModalSwipe('left', -deltaX, progress);
      updateSwipeIndicator('left', progress);
    }
  } else {
    // Vertical swipe
    if (deltaY > 20) {
      // Swiping up
      swipeDirection = 'up';
      isSwipingHorizontal = false;
      e.preventDefault();
      
      // Visual feedback
      const progress = Math.min(1, deltaY / SWIPE_UP_THRESHOLD);
      animateModalSwipe('up', -deltaY, progress);
      updateSwipeIndicator('up', progress);
    }
  }
}

// Handle modal touch end (ENHANCED)
function handleModalTouchEnd(e) {
  if (!touchStartX || !touchStartY) return;
  
  const deltaX = touchStartX - touchEndX;
  const deltaY = touchStartY - touchEndY;
  
  // Check if swipe was sufficient
  if (swipeDirection === 'left' && deltaX > SWIPE_LEFT_THRESHOLD) {
    // Close modal with left swipe animation
    animateModalClose('left');
  } else if (swipeDirection === 'up' && deltaY > SWIPE_UP_THRESHOLD) {
    // Close modal with up swipe animation
    animateModalClose('up');
  } else {
    // Reset modal position
    resetModalPosition();
  }
  
  // Reset
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
    // Swipe left animation
    const translateX = Math.min(150, Math.abs(delta));
    const rotate = translateX * 0.05;
    const scale = 1 - (progress * 0.05);
    
    modalPanel.style.transform = `translateX(${-translateX}px) rotate(${-rotate}deg) scale(${scale})`;
    modalPanel.style.opacity = 1 - (progress * 0.3);
  } else if (direction === 'up') {
    // Swipe up animation (existing)
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
    // Swipe left close animation
    modalPanel.style.transform = 'translateX(-100%) rotate(-10deg) scale(0.9)';
    modalPanel.style.opacity = '0';
  } else if (direction === 'up') {
    // Swipe up close animation
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
  
  // Hide indicators
  updateSwipeIndicator(null, 0);
}

// Handle drag handle touch start (EXISTING)
function handleDragHandleTouchStart(e) {
  const touch = e.touches[0];
  touchStartY = touch.clientY;
  isDragging = true;
  canDrag = true;
  modalPanel.style.transition = 'none';
  modalPanel.classList.add('dragging');
  e.preventDefault();
  e.stopPropagation();
}

// Handle drag handle mouse down (EXISTING)
function handleDragHandleMouseDown(e) {
  touchStartY = e.clientY;
  isDragging = true;
  canDrag = true;
  modalPanel.style.transition = 'none';
  modalPanel.classList.add('dragging');
  e.preventDefault();
}

// Handle footer touch start (EXISTING)
function handleFooterTouchStart(e) {
  const touch = e.touches[0];
  const target = e.target;
  
  // Don't drag if touching buttons or links
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
  
  // Visual feedback
  const footerHint = modalPanel.querySelector('.footer-drag-hint');
  if (footerHint) {
    footerHint.classList.add('active');
  }
  
  e.preventDefault();
  e.stopPropagation();
}

// Handle footer mouse down (EXISTING)
function handleFooterMouseDown(e) {
  const target = e.target;
  
  // Don't drag if clicking buttons or links
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

// Global touch move (EXISTING - for drag handle)
function handleGlobalTouchMove(e) {
  if (!isDragging || !canDrag) return;
  
  const touch = e.touches[0];
  const deltaY = touchStartY - touch.clientY;
  
  // Swiping up
  if (deltaY > 0) {
    const translateY = Math.min(0, -deltaY * 0.5);
    modalPanel.style.transform = `translateY(${translateY}px)`;
    const opacity = Math.max(0.3, 1 - (deltaY / 500));
    modalPanel.style.opacity = opacity;
    e.preventDefault();
  } 
  // Swiping down - add resistance
  else if (deltaY < -10) {
    const translateY = Math.min(30, Math.abs(deltaY) * 0.1);
    modalPanel.style.transform = `translateY(${translateY}px)`;
    e.preventDefault();
  }
  
  touchEndY = touch.clientY;
}

// Global mouse move (EXISTING)
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

// Global touch end (EXISTING)
function handleGlobalTouchEnd(e) {
  if (isDragging && canDrag) {
    finishDrag();
  }
}

// Global mouse up (EXISTING)
function handleGlobalMouseUp(e) {
  if (isDragging && canDrag) {
    finishDrag();
  }
}

// Finish drag (EXISTING)
function finishDrag() {
  isDragging = false;
  canDrag = false;
  modalPanel.classList.remove('dragging');
  
  // Remove footer feedback
  const footerHint = modalPanel.querySelector('.footer-drag-hint');
  if (footerHint) {
    footerHint.classList.remove('active');
  }
  
  const swipeDistance = touchStartY - touchEndY;
  const swipeVelocity = Math.abs(swipeDistance);
  
  // Close if swiped enough
  if (swipeDistance > 120 || (swipeDistance > 80 && swipeVelocity > 120)) {
    modalPanel.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    modalPanel.style.transform = 'translateY(-100%)';
    modalPanel.style.opacity = '0';
    
    setTimeout(() => {
      closeModal();
    }, 300);
  } else {
    // Snap back
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
  
  // Initialize swipe handlers
  setTimeout(() => {
    initSwipeHandlers();
  }, 100);
}

export function closeModal() {
  resetTTS();
  restoreBodyScroll();
  
  // Clean up
  cleanupSwipeHandlers();
  
  // Remove swipe indicators
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