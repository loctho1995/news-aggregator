// Main orchestrator

import { extractFullContentWithParagraphs } from './extractor.js';
import { summarizeByParagraphs } from './summarizer.js';

function preserveVietnameseNumbers(text) {
    // Bảo vệ số tiếng Việt trước khi xử lý
    // Thay dấu chấm trong số bằng placeholder tạm thời
    return text.replace(/(\d)\.(\d{3})/g, '$1__DOT__$2');
}
  
function restoreVietnameseNumbers(text) {
    // Khôi phục lại dấu chấm trong số
    return text.replace(/__DOT__/g, '.');
}

export function extractAndSummarizeContent($, summaryPercent = 70) {
    // Extract content
    const { fullContent, paragraphs, paragraphCount } = extractFullContentWithParagraphs($);
    
    // Bảo vệ số trước khi xử lý
    const protectedParagraphs = paragraphs.map(p => preserveVietnameseNumbers(p));
    
    // Calculate summary ratio
    const summaryRatio = summaryPercent / 100;
    
    // Summarize paragraphs
    const { 
      summarizedParagraphs, 
      summary, 
      originalParagraphCount, 
      summarizedParagraphCount 
    } = summarizeByParagraphs(protectedParagraphs, summaryRatio);
    
    // Khôi phục số sau khi tóm tắt
    const restoredParagraphs = summarizedParagraphs.map(p => restoreVietnameseNumbers(p));
    const restoredSummary = restoreVietnameseNumbers(summary);
    
    // Create bullets from summarized paragraphs  
    const maxBullets = getMaxBullets(summaryPercent);
    const bullets = restoredParagraphs
      .slice(0, maxBullets)
      .map(p => `• ${p}`);
    
    // Calculate stats
    const actualRatio = restoredSummary.length / (fullContent.length || 1);
    const compressionRatio = Math.round(actualRatio * 100);
    
    return {
      fullContent,
      originalParagraphs: paragraphs,
      summarizedParagraphs: restoredParagraphs,
      summary: restoredSummary,
      bullets,
      stats: {
        originalLength: fullContent.length,
        summaryLength: restoredSummary.length,
        compressionRatio,
        originalParagraphCount,
        summarizedParagraphCount,
        summaryPercent,
        actualPercent: compressionRatio
      }
    };
  }

function getMaxBullets(percent) {
  const bulletMap = {
    30: 3,
    40: 4,
    50: 5,
    60: 6,
    70: 7,
    80: 8,
    100: 10
  };
  
  for (const [key, value] of Object.entries(bulletMap)) {
    if (percent <= Number(key)) {
      return value;
    }
  }
  
  return 10;
}