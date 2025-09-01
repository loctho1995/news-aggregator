// public/js/modules/translator.js
// Utilities to call server-side translate API and client-side helpers
// Provides: translateToVietnamese, translateMany, translateBatch, translateCardElement

// ---- Simple helpers to call /api/translate ----

export async function translateToVietnamese(text, target = "vi") {
  const safe = (text == null) ? "" : String(text);
  try {
    const resp = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: safe, target })
    });
    const data = await resp.json();
    return (typeof data.translatedText === "string") ? data.translatedText : safe;
  } catch {
    return safe;
  }
}

export async function translateMany(texts = [], target = "vi") {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const clean = texts.map(t => (t == null) ? "" : String(t));
  try {
    const resp = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: clean, target })
    });
    const data = await resp.json();
    if (Array.isArray(data.translatedTexts)) return data.translatedTexts;
    if (typeof data.translatedText === "string") return [data.translatedText, ...clean.slice(1)];
    return clean;
  } catch {
    return clean;
  }
}

// Alias
export async function translateBatch(texts = [], target = "vi") {
  return translateMany(texts, target);
}

// === Card translation with caching & toggle ===
// - Batches title + content blocks into a single request
// - Caches results in dataset (translatedTitle, translatedBlocks)
// - Toggle back to originals with { toggleOnly: true }
// - Preserves bullet "•" spans (class: no-select)

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
      cardEl.dataset.originalTitle = titleEl ? (titleEl.innerText || "") : "";
    }
    if (!Object.prototype.hasOwnProperty.call(cardEl.dataset, "originalBlocks")) {
      const originals = targets.map(n => n.innerText);
      cardEl.dataset.originalBlocks = JSON.stringify(originals);
    }

    const isTranslated = cardEl.dataset.translated === "true";

    // Toggle back to original
    if (toggleOnly && isTranslated) {
      if (titleEl) titleEl.innerText = cardEl.dataset.originalTitle || "";
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
      const batched = [cardEl.dataset.originalTitle || "", ...originals];
      const translated = await translateBatch(batched, "vi");
      const newTitle = translated[0] || cardEl.dataset.originalTitle || "";
      const newBlocks = translated.slice(1) || [];
      cachedTitle = newTitle;
      cachedBlocks = newBlocks;
      cardEl.dataset.translatedTitle = cachedTitle || "";
      cardEl.dataset.translatedBlocks = JSON.stringify(cachedBlocks || []);
    }

    // Apply translations
    if (titleEl && cachedTitle) titleEl.innerText = cachedTitle;
    if (cachedBlocks && cachedBlocks.length === targets.length) {
      targets.forEach((node, i) => { node.innerText = cachedBlocks[i]; });
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
    console.warn("Translate card error", e);
  }
}
