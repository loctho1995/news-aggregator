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

// Hàm tạo summary dạng bullet points cho card
export function createBulletSummary(fullText, maxLength = 500) {
  if (!fullText || fullText.length < 50) return ["Không có thông tin chi tiết"];
  
  // Tách câu
  const sentences = fullText.match(/[^.!?;]+[.!?;]+/g) || 
                   fullText.match(/[^\n]+/g) || 
                   [fullText];
  
  const bullets = [];
  let totalLength = 0;
  const maxBullets = 4; // Tối đa 4 gạch đầu dòng
  const minBulletLength = 40; // Mỗi bullet ít nhất 40 ký tự
  const maxBulletLength = 120; // Mỗi bullet tối đa 120 ký tự
  
  // Lọc và xử lý câu thành bullets
  for (let i = 0; i < sentences.length && bullets.length < maxBullets; i++) {
    const sent = sentences[i].trim();
    
    // Bỏ qua câu quá ngắn hoặc không có nghĩa
    if (sent.length < 20) continue;
    if (/^(Xem thêm|Đọc thêm|Chia sẻ|Bình luận)/i.test(sent)) continue;
    
    // Nếu câu quá dài, cắt ngắn
    let bulletText = sent;
    if (sent.length > maxBulletLength) {
      const words = sent.split(' ');
      const wordsNeeded = Math.floor(maxBulletLength / 6);
      bulletText = words.slice(0, wordsNeeded).join(' ');
      if (words.length > wordsNeeded) {
        bulletText += '...';
      }
    }
    
    // Kiểm tra tổng độ dài
    if (totalLength + bulletText.length > maxLength) {
      // Nếu đã có ít nhất 2 bullets thì dừng
      if (bullets.length >= 2) break;
      
      // Nếu chưa, cắt bullet này cho vừa
      const remainingSpace = maxLength - totalLength - 10;
      if (remainingSpace > minBulletLength) {
        const words = bulletText.split(' ');
        const wordsToTake = Math.floor(remainingSpace / 6);
        if (wordsToTake > 5) {
          bulletText = words.slice(0, wordsToTake).join(' ') + '...';
        } else {
          continue; // Bỏ qua bullet này
        }
      } else {
        break;
      }
    }
    
    bullets.push(bulletText);
    totalLength += bulletText.length;
  }
  
  // Nếu không có bullet nào, tạo từ text gốc
  if (bullets.length === 0) {
    const chunks = fullText.substring(0, 400).split(/[.!?;]+/);
    for (let i = 0; i < Math.min(3, chunks.length); i++) {
      const chunk = chunks[i].trim();
      if (chunk.length > 20) {
        bullets.push(chunk.length > maxBulletLength ? 
          chunk.substring(0, maxBulletLength - 3) + '...' : 
          chunk);
      }
    }
  }
  
  // Đảm bảo có ít nhất 1 bullet
  if (bullets.length === 0) {
    bullets.push(fullText.substring(0, Math.min(100, fullText.length)) + 
                 (fullText.length > 100 ? '...' : ''));
  }
  
  return bullets;
}

// Giữ hàm cũ cho compatibility
export function createCardSummary(fullText, maxLength = 500) {
  // Chuyển sang dùng bullet summary
  const bullets = createBulletSummary(fullText, maxLength);
  return bullets.join(' • '); // Join với bullet character
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