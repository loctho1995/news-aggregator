export class BulletSummarizer {
  static create(text, maxBullets = 3, maxTotalLength = 800) {
    if (!text || text.length < 50) {
      return {
        bullets: [text || "Không có nội dung"],
        text: text || ""
      };
    }
    
    const sentences = this.extractSentences(text);
    const bullets = this.selectBullets(sentences, maxBullets, maxTotalLength);
    
    return {
      bullets: bullets.map(b => `• ${b}`),
      text: bullets.join('. ')
    };
  }

  static extractSentences(text) {
    const sentences = [];
    let currentSentence = '';
    const chars = text.split('');
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      currentSentence += char;
      
      if (['.', '!', '?', '…'].includes(char)) {
        const beforeChar = i > 0 ? chars[i-1] : '';
        const afterChar = i < chars.length - 1 ? chars[i+1] : '';
        
        // Skip decimal points in numbers
        if (char === '.' && /\d/.test(beforeChar) && /\d/.test(afterChar)) {
          continue;
        }
        
        // Check for sentence end
        if (!afterChar || afterChar === ' ') {
          const trimmed = currentSentence.trim();
          if (trimmed.length > 10) {
            sentences.push(trimmed.replace(/^[-•●○■]\s*/, ''));
          }
          currentSentence = '';
        }
      }
    }
    
    // Add remaining
    if (currentSentence.trim().length > 10) {
      sentences.push(currentSentence.trim());
    }
    
    return sentences;
  }

  static selectBullets(sentences, maxBullets, maxTotalLength) {
    // Score sentences based on importance
    const scored = sentences.map((sentence, index) => ({
      sentence,
      score: this.scoreSentence(sentence, index, sentences.length),
      index
    }));
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    // Select diverse bullets
    const bullets = [];
    let totalLength = 0;
    const usedIndexes = new Set();
    
    for (const item of scored) {
      if (bullets.length >= maxBullets) break;
      
      // Skip if too close to already selected
      let tooClose = false;
      for (const idx of usedIndexes) {
        if (Math.abs(item.index - idx) <= 1) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose || item.score > 10) {
        let bulletText = item.sentence;
        
        // Truncate if necessary
        const remainingSpace = maxTotalLength - totalLength;
        if (bulletText.length > remainingSpace && remainingSpace > 60) {
          bulletText = this.truncateSentence(bulletText, remainingSpace);
        }
        
        if (totalLength + bulletText.length <= maxTotalLength) {
          bullets.push(bulletText);
          usedIndexes.add(item.index);
          totalLength += bulletText.length;
        }
      }
    }
    
    return bullets;
  }

  static scoreSentence(sentence, index, total) {
    let score = 0;
    
    // Length score
    if (sentence.length > 50 && sentence.length < 200) score += 3;
    
    // Position bonus
    if (index === 0) score += 5;
    if (index === 1) score += 3;
    if (index === total - 1) score += 2;
    
    // Content patterns
    if (/\d+/.test(sentence)) score += 3; // Contains numbers
    if (/triệu|tỷ|USD|VND|\$/.test(sentence)) score += 2; // Money
    if (/tăng|giảm|phát triển/.test(sentence)) score += 2; // Trends
    if (/["'"]/.test(sentence)) score += 2; // Quotes
    
    return score;
  }

  static truncateSentence(sentence, maxLength = 250) {
    if (sentence.length <= maxLength) return sentence;
    
    // Try to cut at natural points
    const cutPoints = [',', ';', ' và ', ' hoặc ', ' nhưng '];
    
    for (const point of cutPoints) {
      const idx = sentence.lastIndexOf(point, maxLength - 3);
      if (idx > maxLength * 0.6) {
        return sentence.substring(0, idx) + '...';
      }
    }
    
    // Cut at word boundary
    const words = sentence.substring(0, maxLength - 3).split(' ');
    if (words.length > 1) {
      words.pop();
      return words.join(' ') + '...';
    }
    
    return sentence.substring(0, maxLength - 3) + '...';
  }
}