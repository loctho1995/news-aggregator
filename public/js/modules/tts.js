// Text-to-speech functions

import { elements } from './elements.js';
import { state, updateState } from './state.js';

export function ttsSupported() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function setRateUI(rate) {
  if (elements.rateRange) elements.rateRange.value = rate;
  if (elements.rateLabel) elements.rateLabel.textContent = `${rate}x`;
}

export function resetTTS() {
  if (ttsSupported()) {
    window.speechSynthesis.cancel();
    updateState({ ttsState: "idle" });
    elements.btnSpeak.textContent = "🔊 Đọc to";
  }
}

export function handleSpeak() {
  if (!ttsSupported()) return;
  
  if (state.ttsState === "idle") {
    const text = elements.summaryList.textContent || "";
    if (!text.trim()) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = state.ttsRate;
    utterance.lang = 'vi-VN';
    
    utterance.onstart = () => {
      updateState({ ttsState: "speaking" });
      elements.btnSpeak.textContent = "⏸️ Tạm dừng";
    };
    
    utterance.onend = () => {
      updateState({ ttsState: "idle" });
      elements.btnSpeak.textContent = "🔊 Đọc to";
    };
    
    utterance.onerror = () => {
      updateState({ ttsState: "idle" });
      elements.btnSpeak.textContent = "🔊 Đọc to";
    };
    
    window.speechSynthesis.speak(utterance);
  } else if (state.ttsState === "speaking") {
    window.speechSynthesis.pause();
    updateState({ ttsState: "paused" });
    elements.btnSpeak.textContent = "▶️ Tiếp tục";
  } else if (state.ttsState === "paused") {
    window.speechSynthesis.resume();
    updateState({ ttsState: "speaking" });
    elements.btnSpeak.textContent = "⏸️ Tạm dừng";
  }
}

export function handleStopSpeak() {
  resetTTS();
}

export function handleRateChange(e) {
  const rate = parseFloat(e.target.value);
  updateState({ ttsRate: rate });
  setRateUI(rate);
}