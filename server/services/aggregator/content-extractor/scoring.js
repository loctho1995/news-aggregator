// Scoring logic cho câu

export function scoreSentence(sentence, index, totalSentences) {
  let score = 0;
  
  if (sentence.length < 20) {
    score -= 5;
  }
  
  // Câu có số liệu, phần trăm
  if (/\d+[%]?/.test(sentence)) score += 4;
  
  // Câu có tên riêng
  if (/[A-ZĂÂĐÊÔƠƯ][a-zăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]+/.test(sentence)) score += 2;
  
  // Từ khóa quan trọng
  const importantWords = /tăng|giảm|phát triển|quan trọng|chính|mới|đầu tiên|cuối cùng|kết quả|nguyên nhân|theo|cho biết|khẳng định|tuy nhiên|nhưng|tổng|trung bình|cao nhất|thấp nhất/gi;
  const matches = sentence.match(importantWords);
  if (matches) score += matches.length * 2;
  
  // Trích dẫn
  if (/["'"]/.test(sentence)) score += 3;
  
  // Vị trí câu
  if (index === 0) score += 3;
  if (index === totalSentences - 1) score += 2;
  if (index === 1) score += 1;
  
  // Độ dài hợp lý
  if (sentence.length > 50 && sentence.length < 200) score += 2;
  
  return score;
}

export function scoreBulletSentence(sentence, index, totalSentences) {
  let score = 0;
  const cleanSent = sentence.trim().replace(/^[-•●○■□▪▫◦‣⁃]\s*/, '');
  
  if (cleanSent.length < 20) return -10;
  
  // Thông tin cụ thể
  if (/\d+[%]?/.test(cleanSent)) score += 6;
  if (/triệu|tỷ|nghìn|USD|VND|đồng|\$|€/.test(cleanSent)) score += 5;
  if (/tăng|giảm|phát triển|sụt|tụt|mở rộng|thu hẹp/.test(cleanSent)) score += 4;
  if (/năm \d{4}|tháng \d{1,2}|quý [1-4]|Q[1-4]/.test(cleanSent)) score += 3;
  if (/theo|cho biết|khẳng định|tuyên bố|công bố/.test(cleanSent)) score += 3;
  if (/["'"]/.test(cleanSent)) score += 3;
  if (/nhằm|để|với mục tiêu|với mục đích/.test(cleanSent)) score += 2;
  
  // Từ khóa quan trọng
  const importantWords = /quan trọng|chính|mới|đầu tiên|lớn nhất|cao nhất|thấp nhất|kỷ lục|đột phá|then chốt|quyết định|cốt lõi/gi;
  const matches = cleanSent.match(importantWords);
  if (matches) score += matches.length * 2;
  
  // Vị trí
  if (index === 0) score += 5;
  if (index === 1) score += 3;
  if (index === totalSentences - 1) score += 2;
  
  // Độ dài cho bullet
  if (cleanSent.length > 40 && cleanSent.length < 150) score += 3;
  else if (cleanSent.length > 150 && cleanSent.length < 200) score += 1;
  else if (cleanSent.length >= 200) score -= 2;
  
  // Penalize không mong muốn
  if (/Xem thêm|Đọc thêm|Chia sẻ|Bình luận|Theo dõi|Click|Nhấn vào/.test(cleanSent)) score -= 10;
  
  return score;
}