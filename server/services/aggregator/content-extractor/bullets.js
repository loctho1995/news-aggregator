// Bullet point creation logic

import { SentenceScorer } from './scorer.js';

export class BulletCreator {
  constructor(language = 'vi') {
    this.scorer = new SentenceScorer(language);
  }

  createBullets(text, maxBullets = 3) {
    if (!text || text.length < 50) {
      return {
        bullets: [text || "Không có nội dung"],
        text: text || ""
      };
    }
    
    const sentences = this.extractSentences(text);
    const scoredSentences = this.scorer.scoreMultiple(sentences);
    const bullets = this.selectBullets(scoredSentences, maxBullets);
    
    return {
      bullets: bullets.map(b => `• ${b}`),
      text: bullets.join('. ')
    };
  }

  extractSentences(text) {
    const sentences = text.match(/[^.!?…]+[.!?…]+/g) || 
                     text.split(/[.!?]\s+/).filter(s => s.trim()) ||
                     [text];
    
    return sentences.map(s => s.trim().replace(/^[-•●○■□▪▫◦‣⁃]\s*/, ''));
  }

  selectBullets(scoredSentences, maxBullets) {
    // Filter and sort
    const valid = scoredSentences
      .filter(s => s.score > 0 && s.length > 20 && s.length < 200)
      .sort((a, b) => b.score - a.score);
    
    if (valid.length === 0) {
      return [scoredSentences[0]?.sentence || "Không có nội dung tóm tắt"];
    }
    
    // Select diverse bullets
    const bullets = [];
    const usedIndexes = new Set();
    
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
        
        // Truncate if too long
        if (bulletText.length > 180) {
          bulletText = this.truncateSentence(bulletText);
        }
        
        bullets.push(bulletText);
        usedIndexes.add(sent.index);
        
        if (bullets.length >= maxBullets) break;
      }
    }
    
    return bullets;
  }

  truncateSentence(sentence) {
    const cutPoints = [',', ';', ' và ', ' hoặc ', ' nhưng '];
    const maxLength = 150;
    
    for (const point of cutPoints) {
      const idx = sentence.lastIndexOf(point, maxLength);
      if (idx > 80) {
        return sentence.substring(0, idx) + '...';
      }
    }
    
    const words = sentence.substring(0, maxLength).split(' ');
    return words.slice(0, -1).join(' ') + '...';
  }
}

export function createBulletPointSummary(text, maxBullets = 3) {
  const creator = new BulletCreator('vi');
  return creator.createBullets(text, maxBullets);
}

export function createSmartSummary(fullText, maxLength = 250) {
  if (!fullText || fullText.length < 50) return fullText || "";
  
  const scorer = new SentenceScorer('vi');
  const sentences = fullText.match(/[^.!?…]+[.!?…]+/g) || [fullText];
  const scored = scorer.scoreMultiple(sentences);
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  // Build summary
  let summary = "";
  const used = new Set();
  
  for (const sent of scored) {
    if (summary.length + sent.length <= maxLength) {
      summary = summary ? summary + " " + sent.sentence : sent.sentence;
      used.add(sent.index);
    } else if (summary.length < maxLength * 0.8) {
      // Add partial sentence
      const remaining = maxLength - summary.length - 10;
      const words = sent.sentence.split(' ');
      const partial = words.slice(0, Math.floor(remaining / 6)).join(' ');
      
      if (partial.length > 30) {
        summary += " " + partial + "...";
        break;
      }
    }
  }
  
  return summary || sentences[0].substring(0, maxLength) + '...';
}