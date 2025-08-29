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

// Hàm tóm tắt thông minh cho card description (200-300 ký tự)
export function createCardSummary(fullText, maxLength = 250) {
  if (!fullText || fullText.length < 50) return fullText || "";
  
  // Nếu text đã ngắn sẵn
  if (fullText.length <= maxLength) return fullText;
  
  // Tách câu
  const sentences = fullText.match(/[^.!?…]+[.!?…]+/g) || [fullText];
  
  // Tính điểm cho mỗi câu
  const scoredSentences = sentences.slice(0, 5).map((sentence, index) => {
    let score = 0;
    const cleanSent = sentence.trim();
    
    // Skip câu quá ngắn
    if (cleanSent.length < 20) return null;
    
    // Ưu tiên câu có thông tin quan trọng
    if (/\d+[%]?/.test(cleanSent)) score += 5; // Số liệu
    if (/triệu|tỷ|nghìn|USD|VND|đồng|\$/.test(cleanSent)) score += 4; // Tiền tệ
    if (/tăng|giảm|phát triển|mở|đóng|ra mắt|công bố/.test(cleanSent)) score += 3; // Hành động
    if (/["'"]/.test(cleanSent)) score += 2; // Trích dẫn
    
    // Ưu tiên câu đầu
    if (index === 0) score += 3;
    if (index === 1) score += 1;
    
    // Độ dài phù hợp cho summary
    if (cleanSent.length > 40 && cleanSent.length < 120) score += 2;
    
    return { sentence: cleanSent, score, length: cleanSent.length };
  }).filter(Boolean);
  
  // Sắp xếp theo điểm
  scoredSentences.sort((a, b) => b.score - a.score);
  
  // Xây dựng summary
  let summary = "";
  const targetMin = 200;
  const targetMax = maxLength;
  
  for (const item of scoredSentences) {
    const testSummary = summary ? summary + " " + item.sentence : item.sentence;
    
    // Nếu thêm câu này vẫn trong giới hạn
    if (testSummary.length <= targetMax) {
      summary = testSummary;
      
      // Đã đủ độ dài tối thiểu
      if (summary.length >= targetMin) {
        break;
      }
    } else if (!summary) {
      // Nếu câu đầu tiên quá dài, cắt nó
      const words = item.sentence.split(' ');
      const wordsNeeded = Math.floor(targetMax / 6); // ~6 ký tự/từ
      summary = words.slice(0, wordsNeeded).join(' ');
      
      // Thêm "..." nếu đã cắt
      if (words.length > wordsNeeded) {
        summary += '...';
      }
      break;
    } else {
      // Đã có summary, kiểm tra xem có thể thêm một phần không
      const remainingSpace = targetMax - summary.length - 4; // -4 cho "..."
      
      if (remainingSpace > 50) {
        const words = item.sentence.split(' ');
        const wordsToAdd = Math.floor(remainingSpace / 6);
        
        if (wordsToAdd > 5) {
          summary += " " + words.slice(0, wordsToAdd).join(' ') + '...';
        }
      }
      break;
    }
  }
  
  // Nếu vẫn quá ngắn, lấy thêm từ text gốc
  if (summary.length < targetMin && fullText.length > summary.length) {
    const words = fullText.split(' ');
    const wordsNeeded = Math.ceil(targetMin / 6);
    summary = words.slice(0, wordsNeeded).join(' ');
    
    if (words.length > wordsNeeded) {
      summary += '...';
    }
  }
  
  // Đảm bảo không vượt quá giới hạn
  if (summary.length > targetMax) {
    summary = summary.substring(0, targetMax - 3) + '...';
  }
  
  return summary.trim();
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