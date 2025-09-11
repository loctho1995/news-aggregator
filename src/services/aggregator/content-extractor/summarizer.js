// Paragraph summarization logic

import { SentenceScorer } from './scorer.js';

export class ParagraphSummarizer {
  constructor(language = 'vi') {
    this.scorer = new SentenceScorer(language);
  }

  summarizeParagraph(paragraph, targetRatio = 0.5) {
    if (!paragraph || paragraph.length < 50) return paragraph;
    
    const sentences = this.splitSentences(paragraph);
    
    if (sentences.length === 1) {
      return this.handleSingleSentence(paragraph, targetRatio);
    }
    
    const scoredSentences = this.scorer.scoreMultiple(sentences);
    const selectedSentences = this.selectBestSentences(
      scoredSentences, 
      paragraph.length * targetRatio
    );
    
    return this.combineSentences(selectedSentences);
  }

  splitSentences(text) {
    // Phân tách câu thông minh, không cắt số tiếng Việt
    const sentences = [];
    let currentSentence = '';
    const chars = text.split('');
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      currentSentence += char;
      
      // Kiểm tra dấu kết thúc câu
      if (['.', '!', '?', '…'].includes(char)) {
        const beforeChar = i > 0 ? chars[i-1] : '';
        const afterChar = i < chars.length - 1 ? chars[i+1] : '';
        
        // Bỏ qua dấu chấm trong số (VN format: 1.000.000)
        if (char === '.' && /\d/.test(beforeChar) && /\d/.test(afterChar)) {
          continue;
        }
        
        // Kiểm tra kết thúc câu thực sự
        // Sau dấu câu phải là: kết thúc text, khoảng trắng, hoặc chữ hoa
        if (!afterChar || /\s/.test(afterChar) || 
            (i < chars.length - 2 && /[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(chars[i+2]))) {
          
          const trimmed = currentSentence.trim();
          if (trimmed.length > 5) {
            sentences.push(trimmed);
          }
          currentSentence = '';
        }
      }
    }
    
    // Thêm câu cuối nếu có
    if (currentSentence.trim().length > 5) {
      sentences.push(currentSentence.trim());
    }
    
    return sentences;
  }

  handleSingleSentence(sentence, targetRatio) {
    if (sentence.length <= 200 || targetRatio >= 0.8) {
      return sentence;
    }
    
    // Try natural break points
    const breakPoints = [',', ';', ' và ', ' hoặc ', ' nhưng '];
    const targetLength = Math.floor(sentence.length * targetRatio);
    
    for (const breakPoint of breakPoints) {
      const parts = sentence.split(breakPoint);
      if (parts.length > 1) {
        let result = '';
        for (const part of parts) {
          if (result.length + part.length < targetLength) {
            result += (result ? breakPoint : '') + part;
          } else {
            break;
          }
        }
        if (result.length > 50) {
          return result.trim() + '...';
        }
      }
    }
    
    return sentence.substring(0, targetLength) + '...';
  }

  selectBestSentences(scoredSentences, targetLength) {
    // Filter valid sentences
    const valid = scoredSentences.filter(s => s.score > 0);
    if (valid.length === 0) return [scoredSentences[0]];
    
    // Sort by score
    valid.sort((a, b) => b.score - a.score);
    
    // Select sentences
    const selected = [];
    let currentLength = 0;
    
    for (const sent of valid) {
      if (currentLength < targetLength * 0.8) {
        selected.push(sent);
        currentLength += sent.length;
      } else if (currentLength + sent.length < targetLength * 1.2) {
        selected.push(sent);
        currentLength += sent.length;
      } else {
        break;
      }
    }
    
    // Restore original order
    selected.sort((a, b) => a.index - b.index);
    
    return selected;
  }

  combineSentences(sentences) {
    if (sentences.length === 0) return '';
    return sentences.map(s => s.sentence).join(' ');
  }
}

export function summarizeByParagraphs(paragraphs, summaryRatio = 0.7) {
  if (!paragraphs || paragraphs.length === 0) {
    return { summarizedParagraphs: [], summary: "" };
  }
  
  const summarizer = new ParagraphSummarizer('vi');
  const adjustedRatio = getAdjustedRatio(summaryRatio);
  const summarized = [];
  
  for (const paragraph of paragraphs) {
    if (paragraph && paragraph.trim()) {
      const result = summarizer.summarizeParagraph(paragraph, adjustedRatio);
      if (result && result.length > 20) {
        summarized.push(result);
      }
    }
  }
  
  // Combine short paragraphs if ratio is very low
  if (summaryRatio <= 0.4 && summarized.length > 5) {
    return combineShortParagraphs(summarized, paragraphs.length);
  }
  
  return {
    summarizedParagraphs: summarized,
    summary: summarized.join('\n\n'),
    originalParagraphCount: paragraphs.length,
    summarizedParagraphCount: summarized.length
  };
}

function getAdjustedRatio(summaryRatio) {
  // Create clear differences between levels
  const ratioMap = {
    0.3: 0.30,
    0.4: 0.35,
    0.5: 0.45,
    0.6: 0.55,
    0.7: 0.65,
    0.8: 0.75,
    1.0: 0.85
  };
  
  const keys = Object.keys(ratioMap).map(Number).sort((a, b) => a - b);
  
  for (const key of keys) {
    if (summaryRatio <= key) {
      return ratioMap[key];
    }
  }
  
  return 0.85;
}

function combineShortParagraphs(paragraphs, originalCount) {
  const combined = [];
  let buffer = "";
  
  for (let i = 0; i < paragraphs.length; i++) {
    buffer = buffer ? buffer + " " + paragraphs[i] : paragraphs[i];
    
    if ((i + 1) % 2 === 0 || i === paragraphs.length - 1) {
      combined.push(buffer);
      buffer = "";
    }
  }
  
  return {
    summarizedParagraphs: combined,
    summary: combined.join('\n\n'),
    originalParagraphCount: originalCount,
    summarizedParagraphCount: combined.length
  };
}