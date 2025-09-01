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

export async function translateItemIfNeeded(item) {
  try {
    if (!item || !["internationaleconomics","internationaltech"].includes(item.group)) return item;
    const [title, description, summary, bullets] = await Promise.all([
      translateToVietnamese(item.title || ""),
      translateToVietnamese(item.description || ""),
      translateToVietnamese(item.summary || ""),
      translateMany(item.bullets || [])
    ]);
    return { ...item, title, description, summary, bullets };
  } catch {
    return item;
  }
}
