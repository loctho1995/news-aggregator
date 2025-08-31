// App initialization
// File: public/js/modules/initialization.js

import { elements } from './elements.js';
import { state } from './state.js';
import { closeModal } from './modal.js';
import { loadSummary } from './summary-loader.js';
import { handleSpeak, handleStopSpeak, handleRateChange, setRateUI } from './tts.js';
import { updateFiltersAndRender } from './filters.js';
import { loadNews } from './news-loader.js';

export function initializeUI() {
  // Add custom styles
  addCustomStyles();
  
  // Set initial TTS rate
  setRateUI(state.ttsRate);
}

export function initializeEventHandlers() {
  // Modal events
  elements.modalClose?.addEventListener("click", closeModal);
  elements.modal?.addEventListener("click", (e) => {
    if (e.target === elements.modal || e.target === elements.modalOverlay) {
      closeModal();
    }
  });

  // Summary controls - AUTO RELOAD ON PERCENT CHANGE
  elements.summaryPercent?.addEventListener("change", () => {
    if (state.currentItem && state.currentModalLink) {
      loadSummary(state.currentItem, state.currentModalLink);
    }
  });

  // Hidden regenerate button (kept for compatibility but hidden in UI)
  elements.regenerateBtn?.addEventListener("click", () => {
    if (state.currentItem && state.currentModalLink) {
      loadSummary(state.currentItem, state.currentModalLink);
    }
  });

  // TTS events
  elements.btnSpeak?.addEventListener("click", handleSpeak);
  elements.btnStopSpeak?.addEventListener("click", handleStopSpeak);
  elements.rateRange?.addEventListener("input", handleRateChange);

  // Main app events
  let searchTimeout;
  elements.search?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(updateFiltersAndRender, 300);
  });

  elements.refreshBtn?.addEventListener("click", loadNews);
  elements.sourceSelect?.addEventListener("change", updateFiltersAndRender);
  elements.groupSelect?.addEventListener("change", () => {
    elements.sourceSelect.value = "";
    loadNews();
  });
  elements.hours?.addEventListener("change", loadNews);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !elements.modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function addCustomStyles() {
  if (!document.getElementById('app-styles')) {
    const style = document.createElement('style');
    style.id = 'app-styles';
    style.textContent = `
      /* ===== Card Layout Styles ===== */
      
      /* Card flexbox layout để neo buttons xuống bottom */
      .news-card {
        display: flex;
        flex-direction: column;
        min-height: 380px;
      }
      
      /* Clickable content chiếm toàn bộ không gian còn lại */
      .clickable-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        transition: all 0.2s ease;
        margin: -8px;
        padding: 8px;
        border-radius: 8px;
      }
      
      /* Content area tự động expand */
      .clickable-content > div:last-child {
        flex: 1;
      }
      
      /* Bottom section luôn ở dưới */
      .news-card > div:last-child {
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      /* ===== Title Auto-Sizing Styles ===== */
      
      /* Title styles for auto-sizing */
      .clickable-content h3 {
        overflow-wrap: break-word;
        word-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        -webkit-hyphens: auto;
        -moz-hyphens: auto;
        -ms-hyphens: auto;
        display: block;
        width: 100%;
        min-height: 1.5em;
        transition: color 0.2s ease, font-size 0.2s ease;
      }
      
      /* Smooth transition for title resizing */
      .news-card h3 {
        animation: fadeInTitle 0.3s ease-out;
      }
      
      @keyframes fadeInTitle {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Ensure proper line heights for different sizes */
      .news-card h3.text-xs {
        line-height: 1.25;
        min-height: 2.5em;
      }
      
      .news-card h3.text-sm {
        line-height: 1.375;
        min-height: 2.2em;
      }
      
      .news-card h3.text-base {
        line-height: 1.5;
        min-height: 2em;
      }
      
      .news-card h3.text-lg {
        line-height: 1.5;
        min-height: 1.8em;
      }
      
      .news-card h3.text-xl {
        line-height: 1.5;
        min-height: 1.6em;
      }
      
      /* ===== Text Selection Styles ===== */
      
      /* Cho phép select text trong content area */
      .clickable-content .select-text {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
        cursor: text;
      }
      
      /* Khi hover vào text, hiện cursor text */
      .clickable-content h3:hover,
      .clickable-content ul li span:last-child:hover,
      .clickable-content p:hover {
        cursor: text;
      }
      
      /* Không cho select các elements UI */
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Style cho selected text */
      .clickable-content ::selection {
        background-color: rgba(16, 185, 129, 0.3);
        color: #1f2937;
      }
      
      .clickable-content ::-moz-selection {
        background-color: rgba(16, 185, 129, 0.3);
        color: #1f2937;
      }
      
      /* Visual feedback khi đang select */
      .clickable-content.selecting {
        background-color: transparent !important;
      }
      
      /* Cursor styles */
      .clickable-content {
        cursor: pointer;
      }
      
      .clickable-content.text-selecting {
        cursor: text;
      }
      
      /* ===== Clickable Content Hover Styles ===== */
      
      .clickable-content:hover {
        background-color: rgba(16, 185, 129, 0.03);
      }
      
      /* Visual feedback on hover */
      .clickable-content:hover h3 {
        color: rgb(16, 185, 129);
      }
      
      /* Active state */
      .clickable-content:active {
        transform: scale(0.99);
        background-color: rgba(16, 185, 129, 0.05);
      }
      
      /* ===== Bullet Point Styles ===== */
      
      .news-card ul {
        margin: 0;
        padding: 0;
      }
      
      .news-card ul li {
        margin: 0;
        padding: 0;
        display: flex;
        align-items: flex-start;
        line-height: 1.6;
      }
      
      .news-card ul li:hover {
        background-color: rgba(16, 185, 129, 0.05);
        margin-left: -8px;
        margin-right: -8px;
        padding-left: 8px;
        padding-right: 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      /* Better spacing for bullets */
      .news-card ul li + li {
        margin-top: 8px;
      }
      
      /* Ensure proper text wrapping */
      .news-card ul li span:last-child {
        word-break: break-word;
        overflow-wrap: break-word;
      }
      
      /* ===== Button Styles ===== */
      
      /* Đảm bảo buttons alignment đẹp */
      .news-card .flex.gap-2 {
        display: flex;
        gap: 8px;
        align-items: stretch;
      }
      
      .news-card .flex.gap-2 button,
      .news-card .flex.gap-2 a {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* ===== Modal Summary Styles ===== */
      
      /* Allow text selection in modal */
      #summaryList {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      
      /* Animation cho paragraph summary */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      #summaryList > div {
        animation: slideIn 0.3s ease-out;
        animation-fill-mode: both;
      }
      
      #summaryList > div:nth-child(1) { animation-delay: 0.1s; }
      #summaryList > div:nth-child(2) { animation-delay: 0.2s; }
      #summaryList > div:nth-child(3) { animation-delay: 0.3s; }
      #summaryList > div:nth-child(4) { animation-delay: 0.4s; }
      #summaryList > div:nth-child(5) { animation-delay: 0.5s; }
      #summaryList > div:nth-child(6) { animation-delay: 0.6s; }
      #summaryList > div:nth-child(7) { animation-delay: 0.7s; }
      #summaryList > div:nth-child(8) { animation-delay: 0.8s; }
      
      #summaryList > div:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      
      /* ===== Mobile Text Selection ===== */
      
      @media (hover: none) {
        .clickable-content .select-text {
          -webkit-user-select: text;
          -webkit-touch-callout: default;
        }
        
        /* Long press to select on mobile */
        .clickable-content {
          -webkit-touch-callout: inherit;
        }
        
        .clickable-content:active {
          background-color: rgba(16, 185, 129, 0.08);
        }
      }
      
      /* ===== Responsive Styles ===== */
      
      @media (max-width: 640px) {
        .news-card {
          min-height: 360px;
        }
        
        /* Smaller font sizes on mobile */
        .news-card h3.text-xs {
          font-size: 0.625rem; /* 10px */
        }
        
        .news-card h3.text-sm {
          font-size: 0.75rem; /* 12px */
        }
        
        .news-card h3.text-base {
          font-size: 0.875rem; /* 14px */
        }
        
        .news-card h3.text-lg {
          font-size: 1rem; /* 16px */
        }
        
        .news-card h3.text-xl {
          font-size: 1.125rem; /* 18px */
        }
        
        #summaryList > div {
          padding: 10px;
          margin-bottom: 10px;
        }
      }
      
      @media (min-width: 1024px) {
        .news-card {
          min-height: 400px;
        }
      }
      
      /* ===== Loading & Animation States ===== */
      
      .news-card {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .news-card.entering {
        opacity: 0;
        transform: translateY(10px);
      }
      
      /* ===== Read Status Styles ===== */
      
      .news-card.read {
        opacity: 0.6;
      }
      
      .news-card.read:hover {
        opacity: 0.8;
      }
      
      /* ===== Grid Layout Styles ===== */
      
      #grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1rem;
      }
      
      @media (min-width: 768px) {
        #grid {
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }
      }
      
      /* ===== Scrollbar Styles ===== */
      
      /* Custom scrollbar for webkit browsers */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.5);
      }
      
      /* ===== Focus States for Accessibility ===== */
      
      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      select:focus-visible {
        outline: 2px solid rgb(16, 185, 129);
        outline-offset: 2px;
      }
      
      /* ===== Utility Classes ===== */
      
      .transition-smooth {
        transition: all 0.3s ease;
      }
      
      /* ===== Word Break for Vietnamese ===== */
      .break-words {
        word-break: break-word;
        overflow-wrap: break-word;
      }
      
      .hyphens-auto {
        hyphens: auto;
        -webkit-hyphens: auto;
        -moz-hyphens: auto;
        -ms-hyphens: auto;
      }
    `;
    document.head.appendChild(style);
  }
}