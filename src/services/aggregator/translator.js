// server/services/aggregator/translator.js

export function isVietnamese(text) {
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vietnamesePattern.test(text);
}

export async function translateToVietnamese(text) {
  try {
    // Option 1: LibreTranslate
    const response = await fetch('https://translate.terraprint.co/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target: 'vi',
        format: 'text'
      }),
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.translatedText || text;
    }
  } catch (e) {
    console.log('Translation failed, using fallback');
  }
  
  // Option 2: MyMemory API
  try {
    const encoded = encodeURIComponent(text);
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|vi`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (e) {
    console.log('MyMemory translation failed');
  }
  
  // Fallback: return with [EN] marker
  return `[EN] ${text}`;
}