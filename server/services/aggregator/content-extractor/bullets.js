// Bullet point creation logic

import { SentenceScorer } from './scorer.js';

export class BulletCreator {
  constructor(language = 'vi') {
    this.scorer = new SentenceScorer(language);
  }

  createBullets(text, maxBullets = 3, maxTotalLength = 400) {
    if (!text || text.length < 50) {
      return {
        bullets: [text || "Không có nội dung"],
        text: text || ""
      };
    }
    
    const sentences = this.extractSentences(text);
    const scoredSentences = this.scorer.scoreMultiple(sentences);
    const bullets = this.selectBullets(scoredSentences, maxBullets, maxTotalLength);
    
    return {
      bullets: bullets.map(b => `• ${b}`),
      text: bullets.join('. ')
    };
  }

  extractSentences(text) {
    // Không dùng regex trực tiếp vì nó sẽ cắt sai số tiếng Việt
    // Phân tách thủ công và thông minh hơn
    
    const sentences = [];
    let currentSentence = '';
    const chars = text.split('');
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      currentSentence += char;
      
      // Kiểm tra nếu là dấu kết thúc câu
      if (['.', '!', '?', '…'].includes(char)) {
        // Kiểm tra context xung quanh
        const beforeChar = i > 0 ? chars[i-1] : '';
        const afterChar = i < chars.length - 1 ? chars[i+1] : '';
        const after2Chars = i < chars.length - 2 ? chars[i+2] : '';
        
        // Nếu dấu chấm nằm giữa các số (format tiền VN: 1.000)
        if (char === '.' && /\d/.test(beforeChar) && /\d/.test(afterChar)) {
          // Không cắt, tiếp tục thêm vào câu hiện tại
          continue;
        }
        
        // Nếu sau dấu câu là khoảng trắng hoặc chữ hoa -> kết thúc câu
        if (!afterChar || afterChar === ' ' || 
            (after2Chars && /[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(after2Chars))) {
          
          const trimmed = currentSentence.trim();
          if (trimmed.length > 10) { // Chỉ lấy câu có độ dài hợp lý
            sentences.push(trimmed.replace(/^[-•●○■□▪▫◦‣⁃]\s*/, ''));
          }
          currentSentence = '';
        }
      }
    }
    
    // Thêm phần còn lại nếu có
    if (currentSentence.trim().length > 10) {
      sentences.push(currentSentence.trim().replace(/^[-•●○■□▪▫◦‣⁃]\s*/, ''));
    }
    
    return sentences;
  }

  selectBullets(scoredSentences, maxBullets, maxTotalLength) {
    // Filter and sort
    const valid = scoredSentences
      .filter(s => s.score > 0 && s.length > 20 && s.length < 180) // Reduced max length per bullet
      .sort((a, b) => b.score - a.score);
    
    if (valid.length === 0) {
      const fallback = scoredSentences[0]?.sentence || "Không có nội dung tóm tắt";
      return [this.truncateSentence(fallback, 120)]; // Shorter fallback
    }
    
    // Select diverse bullets with total length constraint
    const bullets = [];
    const usedIndexes = new Set();
    let currentTotalLength = 0;
    
    for (const sent of valid) {
      // Skip if too close to already selected
      let tooClose = false;
      for (const idx of usedIndexes) {
        if (Math.abs(sent.index - idx) <= 1) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose || sent.score > 10) {
        let bulletText = sent.sentence;
        
        // Calculate max length for this bullet considering total limit
        const avgBulletLength = maxTotalLength / maxBullets;
        const remainingSpace = maxTotalLength - currentTotalLength;
        const remainingBullets = maxBullets - bullets.length;
        const maxLengthForThisBullet = Math.min(
          120, // Max per bullet
          remainingSpace - (remainingBullets - 1) * 40 // Reserve space for remaining bullets
        );
        
        // Truncate if necessary
        if (bulletText.length > maxLengthForThisBullet && maxLengthForThisBullet > 40) {
          bulletText = this.truncateSentence(bulletText, maxLengthForThisBullet);
        }
        
        // Check if adding this bullet would exceed total length
        if (currentTotalLength + bulletText.length <= maxTotalLength) {
          bullets.push(bulletText);
          usedIndexes.add(sent.index);
          currentTotalLength += bulletText.length;
          
          if (bullets.length >= maxBullets) break;
        } else if (bullets.length === 0 && maxTotalLength > 80) {
          // If this is the first bullet and we have reasonable space, force add a truncated version
          const forcedLength = Math.min(maxTotalLength - 20, 100);
          const forcedBullet = this.truncateSentence(bulletText, forcedLength);
          bullets.push(forcedBullet);
          break;
        }
      }
    }
    
    return bullets;
  }

  truncateSentence(sentence, maxLength = 120) {
    if (sentence.length <= maxLength) return sentence;
    
    const cutPoints = [',', ';', ' và ', ' hoặc ', ' nhưng ', ' do ', ' vì '];
    
    // Try to cut at natural breakpoints
    for (const point of cutPoints) {
      const idx = sentence.lastIndexOf(point, maxLength - 3);
      if (idx > maxLength * 0.6) { // Ensure meaningful content
        return sentence.substring(0, idx) + '...';
      }
    }
    
    // Cut at word boundary
    const words = sentence.substring(0, maxLength - 3).split(' ');
    if (words.length > 1) {
      words.pop(); // Remove potentially incomplete last word
      return words.join(' ') + '...';
    }
    
    // Last resort: cut at character limit
    return sentence.substring(0, maxLength - 3) + '...';
  }
}

// Enhanced bullet point summary function with stricter limits
export function createBulletPointSummary(text, maxBullets = 3, maxTotalLength = 400) {
  const creator = new BulletCreator('vi');
  return creator.createBullets(text, maxBullets, maxTotalLength);
}

// Adjusted smart summary for shorter output
export function createSmartSummary(fullText, maxLength = 200) {
  if (!fullText || fullText.length < 50) return fullText || "";
  
  const scorer = new SentenceScorer('vi');
  const sentences = fullText.match(/[^.!?…]+[.!?…]+/g) || [fullText];
  const scored = scorer.scoreMultiple(sentences);
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  // Build summary with stricter length control
  let summary = "";
  const used = new Set();
  
  for (const sent of scored) {
    const truncatedSent = sent.length > 100 ? 
      sent.sentence.substring(0, 97) + '...' : 
      sent.sentence;
    
    if (summary.length + truncatedSent.length <= maxLength) {
      summary = summary ? summary + " " + truncatedSent : truncatedSent;
      used.add(sent.index);
    } else if (summary.length < maxLength * 0.7) {
      // Add partial sentence if we haven't reached minimum length
      const remaining = maxLength - summary.length - 3;
      if (remaining > 30) {
        const words = sent.sentence.split(' ');
        const wordsToFit = Math.floor(remaining / 6); // Estimate ~6 chars per word
        
        if (wordsToFit > 2) {
          const partial = words.slice(0, wordsToFit).join(' ');
          summary += " " + partial + "...";
          break;
        }
      }
      break;
    }
  }
  
  // Fallback if summary is too short
  if (summary.length < 50 && sentences.length > 0) {
    const firstSentence = sentences[0];
    if (firstSentence.length > maxLength) {
      summary = firstSentence.substring(0, maxLength - 3) + '...';
    } else {
      summary = firstSentence;
    }
  }
  
  return summary || "Không có nội dung tóm tắt";
}