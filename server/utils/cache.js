// server/utils/cache.js
// Enhanced TTL cache with fallback support

export class TTLCache {
  constructor(defaultTtlMs) {
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();
    this.fallbackMap = new Map(); // Store fallback versions
    this.hits = 0;
    this.misses = 0;
  }
  
  get(key, allowExpired = false) {
    const entry = this.map.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    const isExpired = Date.now() - entry.ts > entry.ttl;
    
    if (isExpired && !allowExpired) {
      // Move to fallback before deleting
      this.fallbackMap.set(key, entry);
      this.map.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }
  
  // Get fallback (expired but still usable)
  getFallback(key) {
    const fallback = this.fallbackMap.get(key);
    if (fallback) {
      return fallback.data;
    }
    
    // Check if expired in main cache
    const expired = this.get(key, true);
    return expired;
  }
  
  set(key, data) {
    this.map.set(key, { 
      data, 
      ts: Date.now(),
      ttl: this.defaultTtlMs,
      lastAccessed: Date.now()
    });
    
    // Also store as fallback
    this.fallbackMap.set(key, {
      data,
      ts: Date.now(),
      ttl: this.defaultTtlMs * 10, // 10x longer for fallback
      lastAccessed: Date.now()
    });
  }
  
  // Set with custom TTL (for mobile optimization)
  setWithTTL(key, data, customTtlMs) {
    this.map.set(key, { 
      data, 
      ts: Date.now(),
      ttl: customTtlMs || this.defaultTtlMs,
      lastAccessed: Date.now()
    });
    
    // Also store as fallback
    this.fallbackMap.set(key, {
      data,
      ts: Date.now(),
      ttl: (customTtlMs || this.defaultTtlMs) * 10,
      lastAccessed: Date.now()
    });
  }
  
  delete(key) { 
    this.map.delete(key);
    this.fallbackMap.delete(key);
  }
  
  clear() { 
    this.map.clear();
    this.fallbackMap.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  // Get cache size
  size() {
    return {
      main: this.map.size,
      fallback: this.fallbackMap.size
    };
  }
  
  // Get cache stats
  stats() {
    const total = this.hits + this.misses;
    return {
      mainSize: this.map.size,
      fallbackSize: this.fallbackMap.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }
  
  // Clean expired entries
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean main cache
    for (const [key, entry] of this.map.entries()) {
      if (now - entry.ts > entry.ttl) {
        // Move to fallback before deleting
        this.fallbackMap.set(key, entry);
        this.map.delete(key);
        cleaned++;
      }
    }
    
    // Clean very old fallbacks
    for (const [key, entry] of this.fallbackMap.entries()) {
      if (now - entry.ts > entry.ttl * 2) { // 2x TTL for fallback
        this.fallbackMap.delete(key);
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cache cleanup: moved ${cleaned} expired entries to fallback`);
    }
    
    return cleaned;
  }
  
  // Clean least recently used if cache is too big
  cleanLRU(maxMainSize = 100, maxFallbackSize = 200) {
    let cleaned = 0;
    
    // Clean main cache
    if (this.map.size > maxMainSize) {
      const entries = Array.from(this.map.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = this.map.size - maxMainSize;
      for (let i = 0; i < toRemove; i++) {
        const [key, value] = entries[i];
        this.fallbackMap.set(key, value); // Move to fallback
        this.map.delete(key);
        cleaned++;
      }
    }
    
    // Clean fallback cache
    if (this.fallbackMap.size > maxFallbackSize) {
      const entries = Array.from(this.fallbackMap.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = this.fallbackMap.size - maxFallbackSize;
      for (let i = 0; i < toRemove; i++) {
        this.fallbackMap.delete(entries[i][0]);
      }
    }
    
    if (cleaned > 0) {
      console.log(`LRU cleanup: moved ${cleaned} entries to fallback`);
    }
    
    return cleaned;
  }
}

// Preconfigured caches with different TTLs
export const summaryCache = new TTLCache(30 * 60 * 1000);      // 30m default
export const translationCache = new TTLCache(24 * 60 * 60 * 1000); // 24h
export const aiSummaryCache = new TTLCache(60 * 60 * 1000);    // 1h

// Mobile-specific cache with longer TTL
export const mobileSummaryCache = new TTLCache(60 * 60 * 1000); // 1h for mobile

// Fallback cache for errors
export const errorFallbackCache = new TTLCache(2 * 60 * 60 * 1000); // 2h for errors

// Auto-cleanup every 5 minutes
setInterval(() => {
  summaryCache.cleanExpired();
  summaryCache.cleanLRU(200, 400); // Max 200 main, 400 fallback
  
  translationCache.cleanExpired();
  translationCache.cleanLRU(500, 1000);
  
  aiSummaryCache.cleanExpired();
  aiSummaryCache.cleanLRU(100, 200);
  
  mobileSummaryCache.cleanExpired();
  mobileSummaryCache.cleanLRU(150, 300);
  
  errorFallbackCache.cleanExpired();
  errorFallbackCache.cleanLRU(50, 100);
  
  // Log stats every hour
  const now = new Date();
  if (now.getMinutes() === 0) {
    console.log('=== Cache Stats ===');
    console.log('Summary Cache:', summaryCache.stats());
    console.log('Mobile Cache:', mobileSummaryCache.stats());
    console.log('Error Fallback:', errorFallbackCache.stats());
    console.log('Translation Cache:', translationCache.stats());
    console.log('==================');
  }
}, 5 * 60 * 1000);

// Clean everything on startup
setTimeout(() => {
  summaryCache.cleanExpired();
  translationCache.cleanExpired();
  aiSummaryCache.cleanExpired();
  mobileSummaryCache.cleanExpired();
  errorFallbackCache.cleanExpired();
  console.log('Initial cache cleanup completed');
}, 1000);