// Scoring logic for sentences

export class SentenceScorer {
  constructor(language = 'vi') {
    this.language = language;
    this.setupPatterns();
  }

  setupPatterns() {
    this.patterns = {
      vi: {
        numbers: /\d+[%]?/,
        money: /triệu|tỷ|nghìn|USD|VND|đồng|\$|€/,
        trends: /tăng|giảm|phát triển|sụt|tụt|mở rộng|thu hẹp/,
        time: /năm \d{4}|tháng \d{1,2}|quý [1-4]|Q[1-4]/,
        sources: /theo|cho biết|khẳng định|tuyên bố|công bố/,
        quotes: /["'"]/,
        purpose: /nhằm|để|với mục tiêu|với mục đích/,
        important: /quan trọng|chính|mới|đầu tiên|lớn nhất|cao nhất|thấp nhất|kỷ lục|đột phá|then chốt|quyết định|cốt lõi/gi
      },
      en: {
        numbers: /\d+[%]?/,
        money: /million|billion|thousand|USD|EUR|\$|€|£/,
        trends: /increase|decrease|grow|decline|expand|shrink/,
        time: /\d{4}|Q[1-4]|quarter|month/,
        sources: /according|said|stated|announced/,
        quotes: /["'"]/,
        purpose: /to|for|aimed|targeted/,
        important: /important|key|new|first|largest|highest|lowest|record|breakthrough|critical|crucial|core/gi
      }
    };
  }

  scoreSentence(sentence, index, totalSentences) {
    let score = 0;
    const patterns = this.patterns[this.language] || this.patterns.vi;
    
    // Length check
    if (sentence.length < 20) return -5;
    if (sentence.length > 200) score -= 2;
    if (sentence.length > 50 && sentence.length < 150) score += 3;
    
    // Pattern matching
    if (patterns.numbers.test(sentence)) score += 6;
    if (patterns.money.test(sentence)) score += 5;
    if (patterns.trends.test(sentence)) score += 4;
    if (patterns.time.test(sentence)) score += 3;
    if (patterns.sources.test(sentence)) score += 3;
    if (patterns.quotes.test(sentence)) score += 3;
    if (patterns.purpose.test(sentence)) score += 2;
    
    const importantMatches = sentence.match(patterns.important);
    if (importantMatches) score += importantMatches.length * 2;
    
    // Position bonus
    if (index === 0) score += 5;
    if (index === 1) score += 3;
    if (index === totalSentences - 1) score += 2;
    
    return score;
  }

  scoreMultiple(sentences) {
    return sentences.map((sent, idx) => ({
      sentence: sent,
      score: this.scoreSentence(sent, idx, sentences.length),
      index: idx,
      length: sent.length
    }));
  }
}
