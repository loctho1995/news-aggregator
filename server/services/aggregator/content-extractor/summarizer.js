// Functions cho việc tóm tắt

import { scoreSentence } from './scoring.js';

export function summarizeParagraph(paragraph, targetRatio = 0.5) {
  if (!paragraph || paragraph.length < 50) return paragraph;
  
  const sentences = paragraph.match(/[^.!?…]+[.!?…]+/g) || [paragraph];
  
  if (sentences.length === 1) {
    return handleSingleSentence(paragraph, targetRatio);
  }
  
  const scoredSentences = sentences.map((sentence, index) => ({
    sentence: sentence.trim(),
    score: scoreSentence(sentence.trim(), index, sentences.length),
    index,
    length: sentence.trim().length
  }));
  
  const validSentences = scoredSentences.filter(s => s.score > 0);
  
  if (validSentences.length === 0) {
    return sentences[0].trim();
  }
  
  return selectBestSentences(validSentences, paragraph.length * targetRatio, paragraph.length);
}

function handleSingleSentence(paragraph, targetRatio) {
  if (paragraph.length > 200 && targetRatio < 0.5) {
    const naturalBreaks = paragraph.split(/[,;]/);
    if (naturalBreaks.length > 1) {
      const targetLength = Math.floor(paragraph.length * targetRatio);
      let result = '';
      for (const part of naturalBreaks) {
        if (result.length < targetLength) {
          result += (result ? ',' : '') + part;
        } else {
          break;
        }
      }
      if (result.length < paragraph.length - 10) {
        return result.trim() + '...';
      }
    }
  }
  return paragraph;
}

function selectBestSentences(validSentences, targetLength, originalLength) {
  validSentences.sort((a, b) => b.score - a.score);
  
  let currentLength = 0;
  const selectedSentences = [];
  
  for (const sentObj of validSentences) {
    if (selectedSentences.length === 0) {
      selectedSentences.push(sentObj);
      currentLength += sentObj.length;
      continue;
    }
    
    if (currentLength < targetLength * 0.8) {
      selectedSentences.push(sentObj);
      currentLength += sentObj.length;
    } else {
      const nextOvershoot = (currentLength + sentObj.length) - targetLength;
      if (nextOvershoot < targetLength * 0.2) {
        selectedSentences.push(sentObj);
        currentLength += sentObj.length;
      }
    }
  }
  
  selectedSentences.sort((a, b) => a.index - b.index);
  let result = selectedSentences.map(s => s.sentence).join(' ');
  
  if (result.length < 30) {
    return validSentences[0].sentence;
  }
  
  if (result.length > originalLength * 0.85 && targetLength / originalLength < 0.6) {
    const topSentences = selectedSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, Math.ceil(validSentences.length * (targetLength / originalLength))))
      .sort((a, b) => a.index - b.index);
    
    result = topSentences.map(s => s.sentence).join(' ');
  }
  
  return result;
}

export function summarizeByParagraphs(paragraphs, summaryRatio = 0.7) {
  if (!paragraphs || paragraphs.length === 0) return { summarizedParagraphs: [], summary: "" };
  
  const summarizedParagraphs = [];
  const adjustedRatio = getAdjustedRatio(summaryRatio);
  
  for (const paragraph of paragraphs) {
    if (paragraph && paragraph.trim()) {
      const summarized = summarizeParagraph(paragraph, adjustedRatio);
      
      if (summarized && summarized.trim() && summarized.length > 20) {
        summarizedParagraphs.push(summarized);
      }
    }
  }
  
  if (summaryRatio <= 0.4 && summarizedParagraphs.length > 5) {
    return combineShortParagraphs(summarizedParagraphs, paragraphs.length);
  }
  
  return {
    summarizedParagraphs: summarizedParagraphs,
    summary: summarizedParagraphs.join('\n\n'),
    originalParagraphCount: paragraphs.length,
    summarizedParagraphCount: summarizedParagraphs.length
  };
}

function getAdjustedRatio(summaryRatio) {
  if (summaryRatio <= 0.3) return 0.30;
  if (summaryRatio <= 0.4) return 0.35;
  if (summaryRatio <= 0.5) return 0.45;
  if (summaryRatio <= 0.6) return 0.55;
  if (summaryRatio <= 0.7) return 0.65;
  if (summaryRatio <= 0.8) return 0.75;
  return 0.85;
}

function combineShortParagraphs(paragraphs, originalCount) {
  const combined = [];
  let buffer = "";
  
  for (let i = 0; i < paragraphs.length; i++) {
    if (buffer) {
      buffer += " " + paragraphs[i];
    } else {
      buffer = paragraphs[i];
    }
    
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