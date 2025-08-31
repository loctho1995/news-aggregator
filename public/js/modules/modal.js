// Modal management with auto-resize title and swipe-to-close
// File: public/js/modules/modal.js

import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { markRead } from './read-status.js';
import { loadSummary } from './summary-loader.js';
import { resetTTS } from './tts.js';

// Swipe handler variables
let touchStartY = 0;
let touchEndY = 0;
let isDragging = false;
let modalPanel = null;
let canDrag = false;

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

// Initialize swipe handlers
function initSwipeHandlers() {
  modalPanel = elements.modalPanel;
  if (!modalPanel) return;
  
  // Add drag handle indicator at top
  if (!document.getElementById('dragHandle')) {
    const dragHandle = document.createElement('div');
    dragHandle.id = 'dragHandle';
    dragHandle.className = 'drag-handle';   
    modalPanel.insertBefore(dragHandle, modalPanel.firstChild);
  }
  
  // Get draggable areas - ONLY drag handle and footer
  const dragHandle = document.getElementById('dragHandle');
  const modalFooter = modalPanel.querySelector('.border-t.border-gray-300.pt-2');
  
  // Touch events ONLY for drag handle
  if (dragHandle) {
    dragHandle.addEventListener('touchstart', handleDragHandleTouchStart, { passive: false });
    dragHandle.addEventListener('mousedown', handleDragHandleMouseDown);
  }
  
  // Touch events ONLY for footer
  if (modalFooter) {
    modalFooter.addEventListener('touchstart', handleFooterTouchStart, { passive: false });
    modalFooter.addEventListener('mousedown', handleFooterMouseDown);
    
    // Add visual indicator to footer on mobile
    if (!modalFooter.querySelector('.footer-drag-hint')) {
      const footerHint = document.createElement('div');
      footerHint.className = 'footer-drag-hint';
      footerHint.innerHTML = `<div class="footer-drag-indicator"></div>`;
      modalFooter.appendChild(footerHint);
    }
  }
  
  // Global handlers for ongoing drag
  document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
  document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
  document.addEventListener('mousemove', handleGlobalMouseMove);
  document.addEventListener('mouseup', handleGlobalMouseUp);
}

// Handle drag handle touch start
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

// Handle footer mouse down
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

// Global touch move
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
  
  // Remove footer feedback
  const footerHint = modalPanel.querySelector('.footer-drag-hint');
  if (footerHint) {
    footerHint.classList.remove('active');
  }
  
  const swipeDistance = touchStartY - touchEndY;
  const swipeVelocity = Math.abs(swipeDistance);
  
  // Close if swiped enough
  if (swipeDistance > 150 || (swipeDistance > 80 && swipeVelocity > 150)) {
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
  
  if (dragHandle) {
    dragHandle.removeEventListener('touchstart', handleDragHandleTouchStart);
    dragHandle.removeEventListener('mousedown', handleDragHandleMouseDown);
  }
  
  if (modalFooter) {
    modalFooter.removeEventListener('touchstart', handleFooterTouchStart);
    modalFooter.removeEventListener('mousedown', handleFooterMouseDown);
  }
  
  document.removeEventListener('touchmove', handleGlobalTouchMove);
  document.removeEventListener('touchend', handleGlobalTouchEnd);
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('mouseup', handleGlobalMouseUp);
  
  isDragging = false;
  canDrag = false;
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