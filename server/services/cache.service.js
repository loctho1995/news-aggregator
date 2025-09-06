import { config } from '../config/index.js';

class Cache {
  constructor(defaultTTL) {
    this.defaultTTL = defaultTTL;
    this.store = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  set(key, data, ttl = null) {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      lastAccessed: Date.now()
    });
  }

  clear() {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.store.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }
}

export class CacheService {
  static summaryCache = new Cache(config.cache.summary);
  static mobileSummaryCache = new Cache(config.cache.mobileSummary);
  static translationCache = new Cache(config.cache.translation);

  static getSummary(key, isMobile = false) {
    const cache = isMobile ? this.mobileSummaryCache : this.summaryCache;
    return cache.get(key);
  }

  static setSummary(key, data, isMobile = false) {
    const cache = isMobile ? this.mobileSummaryCache : this.summaryCache;
    cache.set(key, data);
  }

  static getTranslation(key) {
    return this.translationCache.get(key);
  }

  static setTranslation(key, data) {
    this.translationCache.set(key, data);
  }

  static clearAll() {
    this.summaryCache.clear();
    this.mobileSummaryCache.clear();
    this.translationCache.clear();
  }

  static getStats() {
    return {
      summary: this.summaryCache.getStats(),
      mobile: this.mobileSummaryCache.getStats(),
      translation: this.translationCache.getStats()
    };
  }
}

// Auto cleanup expired entries
setInterval(() => {
  const caches = [
    CacheService.summaryCache,
    CacheService.mobileSummaryCache,
    CacheService.translationCache
  ];

  caches.forEach(cache => {
    const now = Date.now();
    for (const [key, entry] of cache.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.store.delete(key);
      }
    }
  });
}, 5 * 60 * 1000); // Every 5 minutes