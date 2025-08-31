// server/utils/cache.js
// Enhanced TTL cache with mobile optimizations

export class TTLCache {
  constructor(defaultTtlMs) {
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;
  }
  
  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.ts > entry.ttl) {
      this.map.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }
  
  set(key, data) {
    this.map.set(key, { 
      data, 
      ts: Date.now(),
      ttl: this.defaultTtlMs,
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
  }
  
  delete(key) { 
    this.map.delete(key); 
  }
  
  clear() { 
    this.map.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  // Get cache size
  size() {
    return this.map.size;
  }
  
  // Get cache stats
  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.map.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }
  
  // Clean expired entries
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.map.entries()) {
      if (now - entry.ts > entry.ttl) {
        this.map.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
    
    return cleaned;
  }
  
  // Clean least recently used if cache is too big
  cleanLRU(maxSize = 100) {
    if (this.map.size <= maxSize) return 0;
    
    // Sort by last accessed time
    const entries = Array.from(this.map.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest entries
    const toRemove = this.map.size - maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.map.delete(entries[i][0]);
    }
    
    console.log(`LRU cleanup: removed ${toRemove} entries`);
    return toRemove;
  }
}

// Preconfigured caches with different TTLs
export const summaryCache = new TTLCache(30 * 60 * 1000);      // 30m default
export const translationCache = new TTLCache(24 * 60 * 60 * 1000); // 24h
export const aiSummaryCache = new TTLCache(60 * 60 * 1000);    // 1h

// Mobile-specific cache with longer TTL
export const mobileSummaryCache = new TTLCache(60 * 60 * 1000); // 1h for mobile

// Auto-cleanup every 5 minutes
setInterval(() => {
  summaryCache.cleanExpired();
  summaryCache.cleanLRU(200); // Max 200 entries
  
  translationCache.cleanExpired();
  translationCache.cleanLRU(500); // Max 500 entries
  
  aiSummaryCache.cleanExpired();
  aiSummaryCache.cleanLRU(100); // Max 100 entries
  
  mobileSummaryCache.cleanExpired();
  mobileSummaryCache.cleanLRU(150); // Max 150 entries
  
  // Log stats every hour
  const now = new Date();
  if (now.getMinutes() === 0) {
    console.log('=== Cache Stats ===');
    console.log('Summary Cache:', summaryCache.stats());
    console.log('Mobile Cache:', mobileSummaryCache.stats());
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
  console.log('Initial cache cleanup completed');
}, 1000);