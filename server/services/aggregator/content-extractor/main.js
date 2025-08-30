// Main orchestrator

import { extractFullContentWithParagraphs } from './extractor.js';
import { summarizeByParagraphs } from './summarizer.js';

export function extractAndSummarizeContent($, summaryPercent = 70) {
  // Extract content
  const { fullContent, paragraphs, paragraphCount } = extractFullContentWithParagraphs($);
  
  // Calculate summary ratio
  const summaryRatio = summaryPercent / 100;
  
  // Summarize paragraphs
  const { 
    summarizedParagraphs, 
    summary, 
    originalParagraphCount, 
    summarizedParagraphCount 
  } = summarizeByParagraphs(paragraphs, summaryRatio);
  
  // Create bullets from summarized paragraphs
  const maxBullets = getMaxBullets(summaryPercent);
  const bullets = summarizedParagraphs
    .slice(0, maxBullets)
    .map(p => `• ${p}`);
  
  // Calculate stats
  const actualRatio = summary.length / (fullContent.length || 1);
  const compressionRatio = Math.round(actualRatio * 100);
  
  return {
    fullContent,
    originalParagraphs: paragraphs,
    summarizedParagraphs,
    summary,
    bullets,
    stats: {
      originalLength: fullContent.length,
      summaryLength: summary.length,
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