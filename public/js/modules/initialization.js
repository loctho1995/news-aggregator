// App initialization

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

  // Summary controls
  elements.regenerateBtn?.addEventListener("click", () => {
    if (state.currentItem && state.currentModalLink) {
      loadSummary(state.currentItem, state.currentModalLink);
    }
  });

  elements.summaryPercent?.addEventListener("change", () => {
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
      /* Bullet point styles */
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
      
      .news-card {
        min-height: 380px;
        display: flex;
        flex-direction: column;
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
      
      .news-card ul li + li {
        margin-top: 8px;
      }
      
      @media (max-width: 640px) {
        .news-card {
          min-height: 360px;
        }
      }
      
      @media (min-width: 1024px) {
        .news-card {
          min-height: 400px;
        }
      }
      
      .news-card ul li span:last-child {
        word-break: break-word;
        overflow-wrap: break-word;
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
      
      #summaryList > div:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      
      @media (max-width: 640px) {
        #summaryList > div {
          padding: 12px;
          margin-bottom: 12px;
        }
      }

        /* Clickable content area styles */
        .clickable-content {
        position: relative;
        transition: all 0.2s ease;
        margin: -8px;
        padding: 8px;
        border-radius: 8px;
        }

        .clickable-content:hover {
        background-color: rgba(16, 185, 129, 0.03);
        }

        /* Visual feedback on hover */
        .clickable-content:hover h3 {
        color: rgb(16, 185, 129);
        }

        /* Cursor pointer for entire clickable area */
        .clickable-content * {
        cursor: pointer;
        }

        /* Prevent text selection on double click */
        .clickable-content {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        }

        /* Allow text selection in modal */
        #summaryList {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
        }

        /* Active state */
        .clickable-content:active {
        transform: scale(0.99);
        background-color: rgba(16, 185, 129, 0.05);
        }

        /* Responsive hover for mobile */
        @media (hover: none) {
        .clickable-content:active {
            background-color: rgba(16, 185, 129, 0.08);
        }
        }

        /* Ensure proper layout */
        .news-card {
        position: relative;
        }

        /* Smooth transition for all interactive elements */
        .clickable-content,
        .clickable-content h3,
        .clickable-content ul li {
        transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
  }
}