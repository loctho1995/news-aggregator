export class ParagraphSummarizer {
  static summarize(paragraphs, targetRatio = 0.7) {
    if (!paragraphs || paragraphs.length === 0) {
      return {
        paragraphs: [],
        summary: '',
        bullets: []
      };
    }

    const summarized = [];
    
    for (const paragraph of paragraphs) {
      if (paragraph && paragraph.trim()) {
        const result = this.summarizeParagraph(paragraph, targetRatio);
        if (result && result.length > 20) {
          summarized.push(result);
        }
      }
    }

    // Create bullets from summarized paragraphs
    const bullets = summarized
      .slice(0, 5)
      .map(p => {
        const trimmed = p.length > 200 ? p.substring(0, 197) + '...' : p;
        return `• ${trimmed}`;
      });

    return {
      paragraphs: summarized,
      summary: summarized.join('\n\n'),
      bullets: bullets
    };
  }

  static summarizeParagraph(paragraph, targetRatio) {
    if (!paragraph || paragraph.length < 50) return paragraph;
    
    const sentences = this.splitSentences(paragraph);
    
    if (sentences.length === 1) {
      return this.truncateSentence(paragraph, paragraph.length * targetRatio);
    }
    
    const targetLength = Math.floor(paragraph.length * targetRatio);
    const selected = this.selectBestSentences(sentences, targetLength);
    
    return selected.join(' ');
  }

  static splitSentences(text) {
    const sentences = [];
    let current = '';
    const chars = text.split('');
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      current += char;
      
      if (['.', '!', '?', '…'].includes(char)) {
        const before = i > 0 ? chars[i-1] : '';
        const after = i < chars.length - 1 ? chars[i+1] : '';
        
        // Skip decimal points
        if (char === '.' && /\d/.test(before) && /\d/.test(after)) {
          continue;
        }
        
        // End sentence
        if (!after || /\s/.test(after)) {
          const trimmed = current.trim();
          if (trimmed.length > 5) {
            sentences.push(trimmed);
          }
          current = '';
        }
      }
    }
    
    if (current.trim().length > 5) {
      sentences.push(current.trim());
    }
    
    return sentences;
  }

  static selectBestSentences(sentences, targetLength) {
    // Score sentences
    const scored = sentences.map((sentence, index) => ({
      sentence,
      score: this.scoreSentence(sentence, index, sentences.length),
      index
    }));
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    // Select sentences
    const selected = [];
    let currentLength = 0;
    
    for (const item of scored) {
      if (currentLength + item.sentence.length <= targetLength * 1.2) {
        selected.push(item);
        currentLength += item.sentence.length;
        
        if (currentLength >= targetLength * 0.8) break;
      }
    }
    
    // Sort back to original order
    selected.sort((a, b) => a.index - b.index);
    
    return selected.map(s => s.sentence);
  }

  static scoreSentence(sentence, index, total) {
    let score = 0;
    
    // Position score
    if (index === 0) score += 5;
    if (index === 1) score += 3;
    if (index === total - 1) score += 2;
    
    // Content score
    if (/\d+/.test(sentence)) score += 2;
    if (/triệu|tỷ|USD|VND/.test(sentence)) score += 2;
    if (/["'"]/.test(sentence)) score += 2;
    
    // Length score
    if (sentence.length > 50 && sentence.length < 150) score += 1;
    
    return score;
  }

  static truncateSentence(sentence, maxLength) {
    if (sentence.length <= maxLength) return sentence;
    
    const cutPoints = [',', ';', ' và ', ' hoặc ', ' nhưng '];
    
    for (const point of cutPoints) {
      const idx = sentence.lastIndexOf(point, maxLength - 3);
      if (idx > maxLength * 0.6) {
        return sentence.substring(0, idx) + '...';
      }
    }
    
    return sentence.substring(0, maxLength - 3) + '...';
  }
}