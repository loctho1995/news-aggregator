import { config } from '../config/index.js';
import { CacheService } from './cache.service.js';

export class TranslationService {
  static async translate({ text, texts, target = 'vi' }) {
    if (texts && Array.isArray(texts)) {
      return this.translateBatch(texts, target);
    }
    
    if (text) {
      return this.translateSingle(text, target);
    }
    
    throw new Error('No text to translate');
  }

  static async translateSingle(text, target) {
    const cleaned = String(text || '').trim();
    if (!cleaned || cleaned.length < 2) {
      return { translatedText: cleaned };
    }

    // Check cache
    const cacheKey = `${target}:${cleaned.substring(0, 100)}`;
    const cached = CacheService.getTranslation(cacheKey);
    if (cached) {
      return { translatedText: cached };
    }

    // Try translation endpoints
    const translated = await this.tryTranslationEndpoints(cleaned, target);
    
    // Cache result
    if (translated && translated !== cleaned) {
      CacheService.setTranslation(cacheKey, translated);
    }

    return { translatedText: translated };
  }

  static async translateBatch(texts, target) {
    const results = await Promise.all(
      texts.map(text => this.translateSingle(text, target))
    );
    
    return {
      translatedTexts: results.map(r => r.translatedText)
    };
  }

  static async tryTranslationEndpoints(text, target) {
    const endpoints = [
      { name: 'google_gtx', fn: () => this.translateGoogleGTX(text, target) },
      { name: 'google_clients5', fn: () => this.translateGoogleClients5(text, target) },
      { name: 'mymemory', fn: () => this.translateMyMemory(text, target) }
    ];

    for (const endpoint of endpoints) {
      try {
        const result = await endpoint.fn();
        if (result && this.isValidTranslation(result, text)) {
          return result;
        }
      } catch (error) {
        console.warn(`Translation endpoint ${endpoint.name} failed:`, error.message);
      }
    }

    // Return original if all fail
    return text;
  }

  static async translateGoogleGTX(text, target) {
    const url = `${config.apis.translation.google_gtx}?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(config.timeouts.translate)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map(seg => Array.isArray(seg) ? seg[0] : '').join('');
    }
    
    return '';
  }

  static async translateGoogleClients5(text, target) {
    const url = `${config.apis.translation.google_clients5}?client=dict-chrome-ex&sl=auto&tl=${target}&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(config.timeouts.translate)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (data && Array.isArray(data.sentences)) {
      return data.sentences.map(s => s.trans || '').join('');
    }
    
    return '';
  }

  static async translateMyMemory(text, target) {
    const url = `${config.apis.translation.mymemory}?q=${encodeURIComponent(text)}&langpair=auto|${target}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(config.timeouts.translate)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (data?.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      if (!translated.includes('MYMEMORY WARNING')) {
        return translated;
      }
    }
    
    return '';
  }

  static isValidTranslation(translated, original) {
    if (!translated || translated.trim().length === 0) return false;
    
    // Check if only punctuation
    if (/^[.,!?;:\-–—\s]+$/.test(translated)) return false;
    
    // Check if too short compared to original
    if (translated.length < original.length * 0.3 && original.length > 10) return false;
    
    return true;
  }
}