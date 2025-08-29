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

// Hàm tóm tắt thông minh cho card description (400-500 ký tự)
export function createCardSummary(fullText, maxLength = 500) {
  if (!fullText || fullText.length < 50) return fullText || "";
  
  // Nếu text ngắn hơn target, trả về nguyên bản
  if (fullText.length <= maxLength) return fullText;
  
  // Nếu text chỉ hơn target một chút, cắt tại ranh giới từ
  if (fullText.length <= maxLength + 50) {
    const cutPoint = fullText.lastIndexOf(' ', maxLength);
    if (cutPoint > maxLength * 0.8) {
      return fullText.substring(0, cutPoint) + '...';
    }
  }
  
  // Tách câu - hỗ trợ nhiều kiểu ngắt câu
  const sentences = fullText.match(/[^.!?;]+[.!?;]+/g) || 
                   fullText.match(/[^\n]+/g) || 
                   [fullText];
  
  // Build summary từ các câu đầu
  let summary = "";
  const targetMin = 400;
  const targetMax = maxLength;
  
  // Phương pháp 1: Lấy theo thứ tự câu
  for (let i = 0; i < sentences.length && summary.length < targetMin; i++) {
    const sent = sentences[i].trim();
    
    // Bỏ qua câu rác
    if (sent.length < 10) continue;
    if (/^(Xem thêm|Đọc thêm|Chia sẻ|Bình luận)/i.test(sent)) continue;
    
    // Kiểm tra nếu thêm câu này có vượt limit không
    const testLength = summary ? summary.length + sent.length + 1 : sent.length;
    
    if (testLength <= targetMax) {
      summary = summary ? summary + " " + sent : sent;
    } else if (summary.length < targetMin) {
      // Nếu chưa đủ min, cắt câu này và thêm vào
      const remainingSpace = targetMax - summary.length - 4;
      if (remainingSpace > 50) {
        const words = sent.split(' ');
        const wordsToTake = Math.floor(remainingSpace / 6); // ~6 ký tự/từ
        
        if (wordsToTake > 3) {
          const partial = words.slice(0, wordsToTake).join(' ');
          summary = summary ? summary + " " + partial + "..." : partial + "...";
        }
      }
      break;
    }
  }
  
  // Nếu vẫn quá ngắn, lấy trực tiếp từ đầu text
  if (summary.length < targetMin) {
    // Lấy 450 ký tự đầu và cắt tại ranh giới từ
    const directCut = fullText.substring(0, 450);
    const lastSpace = directCut.lastIndexOf(' ');
    
    if (lastSpace > 350) {
      summary = directCut.substring(0, lastSpace) + '...';
    } else {
      summary = directCut + '...';
    }
  }
  
  // Đảm bảo không vượt quá max
  if (summary.length > targetMax) {
    const cutPoint = summary.lastIndexOf(' ', targetMax - 4);
    if (cutPoint > targetMin) {
      summary = summary.substring(0, cutPoint) + '...';
    } else {
      summary = summary.substring(0, targetMax - 3) + '...';
    }
  }
  
  // Làm sạch
  summary = summary
    .replace(/\s+/g, ' ')
    .replace(/\.\.\.\./g, '...')
    .trim();
  
  return summary;
}

// Hàm tóm tắt cũ (giữ cho backward compatibility)
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