// Main export file - tập hợp các functions từ modules con

export { extractFullContent, extractFullContentWithParagraphs } from './extractor.js';
export { summarizeParagraph, summarizeByParagraphs } from './summarizer.js';
export { createBulletPointSummary, createSmartSummary } from './bullet-creator.js';
export { extractAndSummarizeContent } from './main.js';