// Main function kết hợp extract và summarize

import { extractFullContentWithParagraphs } from './extractor.js';
import { summarizeByParagraphs } from './summarizer.js';

export function extractAndSummarizeContent($, summaryPercent = 70) {
  const { fullContent, paragraphs, paragraphCount } = extractFullContentWithParagraphs($);
  
  const summaryRatio = summaryPercent / 100;
  
  const { 
    summarizedParagraphs, 
    summary, 
    originalParagraphCount, 
    summarizedParagraphCount 
  } = summarizeByParagraphs(paragraphs, summaryRatio);
  
  const maxBullets = getMaxBullets(summaryPercent);
  const bullets = summarizedParagraphs
    .slice(0, maxBullets)
    .map(p => `• ${p}`);
  
  const actualRatio = summary.length / (fullContent.length || 1);
  const compressionRatio = Math.round(actualRatio * 100);
  
  return {
    fullContent: fullContent,
    originalParagraphs: paragraphs,
    summarizedParagraphs: summarizedParagraphs,
    summary: summary,
    bullets: bullets,
    stats: {
      originalLength: fullContent.length,
      summaryLength: summary.length,
      compressionRatio: compressionRatio,
      originalParagraphCount: originalParagraphCount,
      summarizedParagraphCount: summarizedParagraphCount,
      summaryPercent: summaryPercent,
      actualPercent: compressionRatio
    }
  };
}

function getMaxBullets(percent) {
  if (percent <= 30) return 3;
  if (percent <= 40) return 4;
  if (percent <= 50) return 5;
  if (percent <= 60) return 6;
  if (percent <= 70) return 7;
  return 10;
}