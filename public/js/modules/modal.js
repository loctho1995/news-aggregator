// Modal management

import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { markRead } from './read-status.js';
import { loadSummary } from './summary-loader.js';
import { resetTTS } from './tts.js';

export function openSummaryModal(item, link) {
  updateState({ 
    currentModalLink: link,
    currentItem: item 
  });
  
  elements.modalTitle.textContent = item?.title || "Tóm tắt";
  elements.modalSource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  elements.modalOpenLink.href = link;

  resetModalUI();
  loadSummary(item, link);
  markRead(link);

  elements.modal.classList.remove("hidden");
  elements.modal.classList.add("flex");
  elements.modal.scrollTop = 0;
  if (elements.modalPanel) elements.modalPanel.scrollTop = 0;
  if (elements.summaryArea) elements.summaryArea.scrollTop = 0;
}

export function closeModal() {
  resetTTS();
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