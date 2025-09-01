// public/js/modules/translator.js
export async function translateToVietnamese(text) {
  if (!text) return "";
  try {
    const resp = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target: "vi" })
    });
    const data = await resp.json();
    return data.translatedText || text;
  } catch {
    return text;
  }
}

export async function translateMany(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const out = [];
  for (const t of arr) out.push(await translateToVietnamese(t || ""));
  return out;
}

// === Card translation with caching & toggle ===
export async function translateCardElement(cardEl, {toggleOnly=false} = {}) {

  try {
    if (!cardEl) return;

    const titleEl = cardEl.querySelector('h3');
    const contentContainer = cardEl.querySelector('.clickable-content');
    if (!contentContainer) return;

    // Collect targets:
    const paragraphNodes = Array.from(contentContainer.querySelectorAll('p')).filter(n => n.innerText && n.innerText.trim().length>0);

    const bulletTextNodes = [];
    const bulletLis = Array.from(contentContainer.querySelectorAll('li'));
    for (const li of bulletLis) {
      const spans = Array.from(li.querySelectorAll('span'));
      if (spans && spans.length >= 1) {
        let textSpan = spans[spans.length - 1];
        const cls = (textSpan.getAttribute('class') || '');
        if (cls.includes('no-select') && spans.length > 1) {
          textSpan = spans[spans.length - 2];
        }
        if (textSpan && textSpan.innerText && textSpan.innerText.trim().length > 0) {
          bulletTextNodes.push(textSpan);
        }
      }
    }

    const targets = [...paragraphNodes, ...bulletTextNodes];

    if (!cardEl.dataset.hasOwnProperty('originalTitle')) {
      cardEl.dataset.originalTitle = titleEl?.innerText || "";
    }
    if (!cardEl.dataset.hasOwnProperty('originalBlocks')) {
      const originals = targets.map(n => n.innerText);
      cardEl.dataset.originalBlocks = JSON.stringify(originals);
    }

    const isTranslated = cardEl.dataset.translated === "true";

    if (toggleOnly && isTranslated) {
      if (titleEl) titleEl.innerText = cardEl.dataset.originalTitle || "";
      try {
        const originals = JSON.parse(cardEl.dataset.originalBlocks || "[]");
        targets.forEach((node, i) => { if (originals[i] !== undefined) node.innerText = originals[i]; });
      } catch {}
      const tag = cardEl.querySelector('.translated-tag');
      if (tag) tag.remove();
      cardEl.dataset.translated = "false";
      return;
    }

    if (isTranslated) return;

    let cachedTitle = cardEl.dataset.translatedTitle || null;
    let cachedBlocks = null;
    try { if (cardEl.dataset.translatedBlocks) cachedBlocks = JSON.parse(cardEl.dataset.translatedBlocks); } catch {}

    if (!cachedTitle || !cachedBlocks || cachedBlocks.length != targets.length) {
      const originals = JSON.parse(cardEl.dataset.originalBlocks || "[]");
      const [newTitle, newBlocks] = await Promise.all([
        translateToVietnamese(cardEl.dataset.originalTitle || ""),
        translateMany(originals)
      ]);
      cachedTitle = newTitle;
      cachedBlocks = newBlocks;
      cardEl.dataset.translatedTitle = cachedTitle || "";
      cardEl.dataset.translatedBlocks = JSON.stringify(cachedBlocks || []);
    }

    if (titleEl && cachedTitle) titleEl.innerText = cachedTitle;
    if (cachedBlocks && cachedBlocks.length === targets.length) {
      targets.forEach((node, i) => { node.innerText = cachedBlocks[i]; });
    }

    cardEl.dataset.translated = "true";
    const tagContainer = cardEl.querySelector('.mt-auto .flex.items-center.justify-between .flex.items-center.gap-2');
    if (tagContainer && !tagContainer.querySelector('.translated-tag')) {
      const tag = document.createElement('span');
      tag.className = 'translated-tag text-blue-600';
      tag.textContent = 'Đã dịch';
      tagContainer.appendChild(tag);
    }
  } catch (e) {
    console.warn('Translate card error', e);
  }

}
