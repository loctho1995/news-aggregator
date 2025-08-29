// Tạo bullet points

import { scoreBulletSentence } from './scoring.js';

export function createBulletPointSummary(fullText, maxBullets = 3) {
  if (!fullText || fullText.length < 50) {
    return {
      bullets: [fullText || "Không có nội dung"],
      text: fullText || ""
    };
  }
  
  const sentences = fullText.match(/[^.!?…]+[.!?…]+/g) || 
                   fullText.split(/[.!?]\s+/).filter(s => s.trim()) ||
                   [fullText];
  
  const scoredSentences = sentences.map((sentence, index) => {
    const cleanSent = sentence.trim().replace(/^[-•●○■□▪▫◦‣⁃]\s*/, '');
    return { 
      sentence: cleanSent, 
      score: scoreBulletSentence(sentence, index, sentences.length), 
      index,
      length: cleanSent.length 
    };
  });
  
  const validSentences = scoredSentences
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  
  if (validSentences.length === 0) {
    const firstSent = sentences[0] ? sentences[0].trim() : fullText.substring(0, 150) + '...';
    return {
      bullets: [`• ${firstSent}`],
      text: firstSent
    };
  }
  
  const bullets = selectBullets(validSentences, maxBullets);
  
  // Nếu chưa đủ, thêm từ câu gốc
  if (bullets.length < maxBullets) {
    addMoreBullets(bullets, sentences, maxBullets);
  }
  
  // Format với dấu •
  const formattedBullets = bullets.map(bullet => `• ${bullet}`);
  
  return {
    bullets: formattedBullets,
    text: bullets.join('. ')
  };
}

function selectBullets(validSentences, maxBullets) {
  const bullets = [];
  const usedIndexes = new Set();
  
  for (const sentObj of validSentences) {
    // Tránh câu liền kề
    let tooClose = false;
    for (const usedIdx of usedIndexes) {
      if (Math.abs(sentObj.index - usedIdx) <= 1) {
        tooClose = true;
        break;
      }
    }
    
    if (bullets.length > 0 && tooClose && sentObj.score < 10) continue;
    
    let bulletText = sentObj.sentence;
    if (bulletText.length > 180) {
      bulletText = truncateSentence(bulletText);
    }
    
    bullets.push(bulletText);
    usedIndexes.add(sentObj.index);
    
    if (bullets.length >= maxBullets) break;
  }
  
  return bullets;
}

function truncateSentence(sentence) {
  const cutPoints = [
    sentence.lastIndexOf(',', 150),
    sentence.lastIndexOf(';', 150),
    sentence.lastIndexOf(' và ', 150),
    sentence.lastIndexOf(' hoặc ', 150),
    sentence.lastIndexOf(' nhưng ', 150)
  ].filter(pos => pos > 80);
  
  if (cutPoints.length > 0) {
    const cutAt = Math.max(...cutPoints);
    return sentence.substring(0, cutAt) + '...';
  } else {
    const words = sentence.substring(0, 150).split(' ');
    return words.slice(0, -1).join(' ') + '...';
  }
}

function addMoreBullets(bullets, sentences, maxBullets) {
  for (const sent of sentences.slice(0, 10)) {
    const cleanSent = sent.trim().replace(/^[-•●○■□▪▫◦‣⁃]\s*/, '');
    
    const alreadyUsed = bullets.some(b => 
      b.includes(cleanSent.substring(0, 50)) || 
      cleanSent.includes(b.substring(0, 50))
    );
    
    if (!alreadyUsed && cleanSent.length > 30 && cleanSent.length < 200) {
      bullets.push(cleanSent.length > 180 ? 
        cleanSent.substring(0, 150) + '...' : 
        cleanSent
      );
      
      if (bullets.length >= maxBullets) break;
    }
  }
}

export function createSmartSummary(fullText, maxLength = 250) {
  // Implementation giữ nguyên từ file gốc
  // ... (code từ function createSmartSummary gốc)
}