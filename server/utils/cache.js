// server/utils/cache.js
// Simple TTL map-based caches
export class TTLCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.map = new Map();
  }
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.map.delete(key);
      return null;
    }
    return entry.data;
  }
  set(key, data) {
    this.map.set(key, { data, ts: Date.now() });
  }
  delete(key) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

// Preconfigured caches (match original semantics)
export const summaryCache = new TTLCache(30 * 60 * 1000);      // 30m
export const translationCache = new TTLCache(24 * 60 * 60 * 1000); // 24h
export const aiSummaryCache = new TTLCache(60 * 60 * 1000);    // 1h