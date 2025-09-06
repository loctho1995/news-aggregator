// public/js/modules/translator.js
// Utilities to call server-side translate API and client-side helpers
// Provides: translateToVietnamese, translateMany, translateBatch, translateCardElement

// ---- Simple helpers to call /api/translate ----

export async function translateToVietnamese(text, target = "vi") {
  const safe = (text == null) ? "" : String(text).trim();
  
  // Không dịch nếu text quá ngắn
  if (safe.length < 2) return safe;
  
  try {
    const resp = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: safe, target })
    });
    const data = await resp.json();
    
    // Kiểm tra kết quả dịch hợp lệ
    if (typeof data.translatedText === "string" && data.translatedText.trim().length > 0) {
      const translated = data.translatedText.trim();
      
      // Nếu kết quả quá ngắn so với gốc (có thể bị lỗi), giữ nguyên
      if (translated.length < safe.length * 0.3 && safe.length > 10) {
        console.warn('Translation too short, keeping original:', { original: safe, translated });
        return safe;
      }
      
      // Nếu chỉ có dấu câu hoặc ký tự đặc biệt, giữ nguyên
      if (/^[.,!?;:\-–—\s]+$/.test(translated)) {
        console.warn('Translation only punctuation, keeping original:', { original: safe, translated });
        return safe;
      }
      
      return translated;
    }
    
    return safe;
  } catch (err) {
    console.error('Translation error:', err);
    return safe;
  }
}

export async function translateMany(texts = [], target = "vi") {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  
  const clean = texts.map(t => (t == null) ? "" : String(t).trim());
  
  try {
    const resp = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: clean, target })
    });
    const data = await resp.json();
    
    if (Array.isArray(data.translatedTexts)) {
      // Validate each translation
      return data.translatedTexts.map((translated, index) => {
        const original = clean[index];
        
        // Kiểm tra translation hợp lệ
        if (!translated || translated.trim().length === 0) {
          return original;
        }
        
        // Nếu quá ngắn, giữ nguyên
        if (translated.length < original.length * 0.3 && original.length > 10) {
          return original;
        }
        
        // Nếu chỉ có dấu câu, giữ nguyên
        if (/^[.,!?;:\-–—\s]+$/.test(translated)) {
          return original;
        }
        
        return translated;
      });
    }
    
    if (typeof data.translatedText === "string") {
      return [data.translatedText, ...clean.slice(1)];
    }
    
    return clean;
  } catch (err) {
    console.error('Batch translation error:', err);
    return clean;
  }
}

// Alias
export async function translateBatch(texts = [], target = "vi") {
  return translateMany(texts, target);
}

// === Card translation with caching & toggle ===
export async function translateCardElement(cardEl, { toggleOnly = false } = {}) {
  try {
    if (!cardEl) return;

    const titleEl = cardEl.querySelector("h3");
    const contentContainer = cardEl.querySelector(".clickable-content");
    if (!contentContainer) return;

    // Collect text targets
    const paragraphNodes = Array.from(contentContainer.querySelectorAll("p"))
      .filter(n => n.innerText && n.innerText.trim().length > 0);

    const bulletTextNodes = [];
    const bulletLis = Array.from(contentContainer.querySelectorAll("li"));
    for (const li of bulletLis) {
      const spans = Array.from(li.querySelectorAll("span"));
      if (spans.length > 0) {
        let textSpan = spans[spans.length - 1];
        const cls = textSpan.getAttribute("class") || "";
        if (cls.includes("no-select") && spans.length > 1) {
          textSpan = spans[spans.length - 2];
        }
        if (textSpan && textSpan.innerText && textSpan.innerText.trim().length > 0) {
          bulletTextNodes.push(textSpan);
        }
      }
    }

    const targets = [...paragraphNodes, ...bulletTextNodes];

    // Save originals once
    if (!Object.prototype.hasOwnProperty.call(cardEl.dataset, "originalTitle")) {
      const originalTitle = titleEl ? (titleEl.innerText || "").trim() : "";
      // Lưu title gốc đầy đủ, không bị cắt
      cardEl.dataset.originalTitle = originalTitle;
    }
    if (!Object.prototype.hasOwnProperty.call(cardEl.dataset, "originalBlocks")) {
      const originals = targets.map(n => n.innerText.trim());
      cardEl.dataset.originalBlocks = JSON.stringify(originals);
    }

    const isTranslated = cardEl.dataset.translated === "true";

    // Toggle back to original
    if (toggleOnly && isTranslated) {
      if (titleEl) {
        const originalTitle = cardEl.dataset.originalTitle || "";
        if (originalTitle) {
          titleEl.innerText = originalTitle;
        }
      }
      try {
        const originals = JSON.parse(cardEl.dataset.originalBlocks || "[]");
        targets.forEach((node, i) => {
          if (originals[i] !== undefined) node.innerText = originals[i];
        });
      } catch {}
      const tag = cardEl.querySelector(".translated-tag");
      if (tag) tag.remove();
      cardEl.dataset.translated = "false";
      return;
    }

    // Already translated and not toggling → nothing to do
    if (isTranslated) return;

    // Try cache
    let cachedTitle = cardEl.dataset.translatedTitle || null;
    let cachedBlocks = null;
    try {
      if (cardEl.dataset.translatedBlocks) {
        cachedBlocks = JSON.parse(cardEl.dataset.translatedBlocks);
      }
    } catch {}

    // No cache or mismatch → batch translate once
    if (!cachedTitle || !cachedBlocks || cachedBlocks.length !== targets.length) {
      const originals = JSON.parse(cardEl.dataset.originalBlocks || "[]");
      const originalTitle = cardEl.dataset.originalTitle || "";
      
      // Đảm bảo title không bị mất
      if (!originalTitle || originalTitle.trim().length < 2) {
        console.warn('Original title too short, skipping translation');
        return;
      }
      
      const batched = [originalTitle, ...originals];
      const translated = await translateBatch(batched, "vi");
      
      // Validate translated title
      let newTitle = translated[0] || originalTitle;
      
      // Nếu title dịch bị lỗi, giữ nguyên gốc
      if (!newTitle || newTitle.trim().length < 2 || /^[.,!?;:\-–—\s]+$/.test(newTitle)) {
        console.warn('Translated title invalid, keeping original:', { 
          original: originalTitle, 
          translated: newTitle 
        });
        newTitle = originalTitle;
      }
      
      // Nếu title dịch quá ngắn so với gốc
      if (newTitle.length < originalTitle.length * 0.3 && originalTitle.length > 10) {
        console.warn('Translated title too short, keeping original:', { 
          original: originalTitle, 
          translated: newTitle 
        });
        newTitle = originalTitle;
      }
      
      const newBlocks = translated.slice(1) || [];
      
      cachedTitle = newTitle;
      cachedBlocks = newBlocks;
      cardEl.dataset.translatedTitle = cachedTitle || "";
      cardEl.dataset.translatedBlocks = JSON.stringify(cachedBlocks || []);
    }

    // Apply translations
    if (titleEl && cachedTitle && cachedTitle.trim().length > 1) {
      titleEl.innerText = cachedTitle;
    }
    
    if (cachedBlocks && cachedBlocks.length === targets.length) {
      targets.forEach((node, i) => { 
        if (cachedBlocks[i] && cachedBlocks[i].trim().length > 0) {
          node.innerText = cachedBlocks[i];
        }
      });
    }

    // Mark translated and add tag
    cardEl.dataset.translated = "true";
    const tagContainer = cardEl.querySelector(
      ".mt-auto .flex.items-center.justify-between .flex.items-center.gap-2"
    );
    if (tagContainer && !tagContainer.querySelector(".translated-tag")) {
      const tag = document.createElement("span");
      tag.className = "translated-tag text-blue-600";
      tag.textContent = "Đã dịch";
      tagContainer.appendChild(tag);
    }
  } catch (e) {
    console.error("Translate card error", e);
  }
}