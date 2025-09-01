// server/services/news-cache-store.js
import { fetchAllStreaming } from './aggregator/index.js';
import dayjs from 'dayjs';

class NewsStore {
  constructor() {
    this.data = new Map(); // { groupId: { items: [], lastUpdated, isUpdating } }
    this.DEFAULT_HOURS = 48; // 48 hours default
    this.updateQueue = [];
    this.isProcessingQueue = false;
    this.initialized = false;
    
    // Predefine all groups for preloading
    this.ALL_GROUPS = ['all', 'vietnam', 'internationaleconomics', 'internationaltech'];
  }

  // Initialize cache on server start
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing news cache for all groups...');
    this.initialized = true;
    
    // Preload all groups with staggered timing
    for (let i = 0; i < this.ALL_GROUPS.length; i++) {
      const group = this.ALL_GROUPS[i];
      setTimeout(() => {
        this.queueUpdate(group);
      }, i * 5000); // 5 seconds between each group
    }
  }

  // Get cached news for a group - ALWAYS returns data (empty if not ready)
  getCachedNews(group = 'all', sources = []) {
    const cacheKey = this.getCacheKey(group, sources);
    const cached = this.data.get(cacheKey);
    
    // If no cache exists, return empty but queue update
    if (!cached || !cached.items) {
      // Queue update in background
      this.queueUpdate(group, sources);
      
      return { 
        items: [], 
        cached: false, 
        lastUpdated: null,
        status: 'loading',
        message: 'Loading news...'
      };
    }
    
    // Return cached data immediately
    return {
      items: cached.items,
      cached: true,
      lastUpdated: cached.lastUpdated,
      totalItems: cached.items.length,
      cacheAge: this.getCacheAge(cached.lastUpdated),
      status: 'ready'
    };
  }

  // Calculate cache age in human readable format
  getCacheAge(lastUpdated) {
    if (!lastUpdated) return 'never';
    
    const minutes = dayjs().diff(lastUpdated, 'minute');
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Generate cache key
  getCacheKey(group, sources = []) {
    if (sources.length > 0) {
      return `${group}_${sources.sort().join(',')}`;
    }
    return group;
  }

  // Update news for a specific group with smart throttling
  async updateNewsForGroup(group = 'all', sources = [], forceUpdate = false) {
    const cacheKey = this.getCacheKey(group, sources);
    const existing = this.data.get(cacheKey);
    
    // Skip if recently updated (unless forced)
    if (!forceUpdate && existing && existing.lastUpdated) {
      const minutesSinceUpdate = dayjs().diff(existing.lastUpdated, 'minute');
      if (minutesSinceUpdate < 30) { // Skip if updated within 30 minutes
        console.log(`⏭️ Skipping ${cacheKey} - recently updated ${minutesSinceUpdate}m ago`);
        return existing.items;
      }
    }
    
    // Skip if already updating
    if (existing?.isUpdating) {
      console.log(`⏳ ${cacheKey} is already updating`);
      return existing.items || [];
    }
    
    // Mark as updating
    this.data.set(cacheKey, {
      items: existing?.items || [],
      lastUpdated: existing?.lastUpdated || null,
      isUpdating: true
    });
    
    console.log(`🔄 Updating news for group: ${cacheKey}`);
    const startTime = Date.now();
    const newItems = [];
    const errors = [];
    
    try {
      await fetchAllStreaming({
        include: sources,
        hours: this.DEFAULT_HOURS,
        limitPerSource: 20, // Reduced to avoid overload
        group: group === 'all' ? null : group,
        onItem: (item) => {
          if (!item.error) {
            newItems.push(item);
          } else {
            errors.push(item);
          }
        }
      });
      
      // Sort by date (newest first)
      newItems.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
        const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
        return dateB - dateA;
      });
      
      // Update cache
      this.data.set(cacheKey, {
        items: newItems,
        lastUpdated: new Date(),
        isUpdating: false,
        errors: errors.length > 0 ? errors : undefined
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Updated ${cacheKey}: ${newItems.length} items in ${duration}s`);
      
      return newItems;
      
    } catch (error) {
      console.error(`❌ Failed to update ${cacheKey}:`, error);
      
      // Keep old data but mark as not updating
      this.data.set(cacheKey, {
        items: existing?.items || [],
        lastUpdated: existing?.lastUpdated || null,
        isUpdating: false,
        error: error.message
      });
      
      return existing?.items || [];
    }
  }

  // Queue update with smart scheduling
  async queueUpdate(group = 'all', sources = []) {
    const cacheKey = this.getCacheKey(group, sources);
    
    // Check if already have fresh data
    const existing = this.data.get(cacheKey);
    if (existing?.lastUpdated) {
      const ageMinutes = dayjs().diff(existing.lastUpdated, 'minute');
      if (ageMinutes < 30) {
        console.log(`✅ ${cacheKey} is fresh (${ageMinutes}m old), skipping queue`);
        return;
      }
    }
    
    // Check if already in queue
    const exists = this.updateQueue.some(t => 
      t.group === group && 
      JSON.stringify(t.sources) === JSON.stringify(sources)
    );
    
    if (!exists) {
      this.updateQueue.push({ group, sources, timestamp: Date.now() });
      console.log(`📋 Queued update for ${cacheKey}`);
    }
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  // Process update queue with delays
  async processQueue() {
    if (this.isProcessingQueue || this.updateQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    console.log(`🚀 Processing queue with ${this.updateQueue.length} tasks`);
    
    while (this.updateQueue.length > 0) {
      const task = this.updateQueue.shift();
      
      try {
        await this.updateNewsForGroup(task.group, task.sources);
        
        // Smart delay between updates (2-5 seconds based on source)
        const delay = this.calculateDelay(task.group);
        console.log(`⏱️ Waiting ${delay}ms before next update...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.error(`Failed to process task:`, error);
      }
    }
    
    this.isProcessingQueue = false;
    console.log(`✅ Queue processing completed`);
  }

  // Calculate smart delay based on source type
  calculateDelay(group) {
    // Different delays for different groups to avoid detection
    const delays = {
      'vietnam': 3000 + Math.random() * 2000,           // 3-5s for Vietnamese sources
      'internationaleconomics': 4000 + Math.random() * 2000, // 4-6s for international
      'internationaltech': 4000 + Math.random() * 2000,      // 4-6s for tech
      'all': 3500 + Math.random() * 1500                    // 3.5-5s for all
    };
    
    return Math.floor(delays[group] || 3000);
  }

  // Update all groups (for scheduled job)
  async updateAllGroups() {
    console.log(`🔄 Starting scheduled update for all groups...`);
    
    // Queue all updates
    for (const group of this.ALL_GROUPS) {
      await this.queueUpdate(group);
    }
  }

  // Get store statistics
  getStats() {
    const stats = {};
    
    for (const [key, value] of this.data.entries()) {
      stats[key] = {
        itemCount: value.items?.length || 0,
        lastUpdated: value.lastUpdated,
        cacheAge: this.getCacheAge(value.lastUpdated),
        isUpdating: value.isUpdating,
        hasError: !!value.error
      };
    }
    
    return {
      initialized: this.initialized,
      groups: stats,
      totalCached: Array.from(this.data.values())
        .reduce((sum, v) => sum + (v.items?.length || 0), 0),
      queueLength: this.updateQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }

  // Clean old items from cache (keep only last 48h)
  cleanOldItems() {
    const cutoff = dayjs().subtract(this.DEFAULT_HOURS, 'hour');
    let totalRemoved = 0;
    
    for (const [key, value] of this.data.entries()) {
      if (!value.items) continue;
      
      const before = value.items.length;
      value.items = value.items.filter(item => {
        if (!item.publishedAt) return true;
        return dayjs(item.publishedAt).isAfter(cutoff);
      });
      
      const removed = before - value.items.length;
      if (removed > 0) {
        totalRemoved += removed;
        console.log(`🧹 Cleaned ${removed} old items from ${key}`);
      }
    }
    
    if (totalRemoved > 0) {
      console.log(`🧹 Total cleaned: ${totalRemoved} items older than ${this.DEFAULT_HOURS}h`);
    }
    
    return totalRemoved;
  }

  // Check if all groups are loaded
  isReady() {
    for (const group of this.ALL_GROUPS) {
      const data = this.data.get(group);
      if (!data || !data.items || data.items.length === 0) {
        return false;
      }
    }
    return true;
  }

  // Get loading progress
  getLoadingProgress() {
    let loaded = 0;
    const total = this.ALL_GROUPS.length;
    
    for (const group of this.ALL_GROUPS) {
      const data = this.data.get(group);
      if (data && data.items && data.items.length > 0) {
        loaded++;
      }
    }
    
    return {
      loaded,
      total,
      percentage: Math.round((loaded / total) * 100),
      isComplete: loaded === total
    };
  }
}

// Create singleton instance
export const newsStore = new NewsStore();