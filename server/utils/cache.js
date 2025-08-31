// File: server/utils/cache.js
// Enhanced cache with custom TTL support

export class TTLCache {
  constructor(defaultTtlMs) {
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();
  }
  
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > entry.ttl) {
      this.map.delete(key);
      return null;
    }
    return entry.data;
  }
  
  set(key, data) {
    this.map.set(key, { 
      data, 
      ts: Date.now(),
      ttl: this.defaultTtlMs 
    });
  }
  
  // NEW: Set with custom TTL
  setWithTTL(key, data, customTtlMs) {
    this.map.set(key, { 
      data, 
      ts: Date.now(),
      ttl: customTtlMs || this.defaultTtlMs
    });
  }
  
  delete(key) { 
    this.map.delete(key); 
  }
  
  clear() { 
    this.map.clear(); 
  }
  
  // NEW: Get cache size
  size() {
    return this.map.size;
  }
  
  // NEW: Clean expired entries
  cleanExpired() {
    const now = Date.now();
    for (const [key, entry] of this.map.entries()) {
      if (now - entry.ts > entry.ttl) {
        this.map.delete(key);
      }
    }
  }
}

// Preconfigured caches with auto-cleanup
export const summaryCache = new TTLCache(30 * 60 * 1000);      // 30m default
export const translationCache = new TTLCache(24 * 60 * 60 * 1000); // 24h
export const aiSummaryCache = new TTLCache(60 * 60 * 1000);    // 1h

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  summaryCache.cleanExpired();
  translationCache.cleanExpired();
  aiSummaryCache.cleanExpired();
}, 5 * 60 * 1000);