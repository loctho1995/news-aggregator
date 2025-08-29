// server/services/aggregator/utils.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(relativeTime);

export const DEFAULT_TZ = "Asia/Bangkok";

export const toArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);

export function cleanText(htmlOrText, maxLen = 240) {
  if (!htmlOrText) return "";
  const text = String(htmlOrText).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

export function toISO(dateLike) {
  if (!dateLike) return null;
  const d = dayjs(dateLike);
  return d.isValid() ? d.toISOString() : null;
}

export function deriveCategoriesFromURL(href) {
  try {
    const u = new URL(href);
    const segs = u.pathname.split("/").filter(Boolean);
    const cat = segs.filter(s => !/^\d/.test(s)).slice(0, 2).map(s => s.replace(/[-_]/g, " "));
    return cat;
  } catch { 
    return []; 
  }
}

export function summarizeContent(text, maxBullets = 3) {
  if (!text || text.length < 100) return text || "";
  
  const sentences = text.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [];
  const bullets = [];
  let buf = "";
  
  for (const s of sentences.slice(0, maxBullets * 3)) {
    const cleaned = s.trim();
    if (cleaned.length < 30) continue;
    
    const next = (buf ? buf + " " : "") + cleaned;
    if (next.length < 200) {
      buf = next;
    } else {
      if (buf) bullets.push(buf);
      buf = cleaned;
      if (bullets.length >= maxBullets) break;
    }
  }
  
  if (buf && bullets.length < maxBullets) bullets.push(buf);
  
  return bullets.join(". ").slice(0, 280);
}