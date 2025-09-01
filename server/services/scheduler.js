// server/services/scheduler.js
import cron from 'node-cron';
import { newsStore } from './news-cache-store.js';

class NewsScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
    this.startTime = null;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler already running');
      return;
    }

    console.log('🕐 Starting news update scheduler...');
    this.startTime = new Date();
    
    // Job 1: Update all news every 2 hours
    // Cron format: minute hour * * *
    const updateJob = cron.schedule('0 */2 * * *', async () => {
      console.log('⏰ [CRON] Running scheduled news update...');
      try {
        await newsStore.updateAllGroups();
        console.log('✅ [CRON] Scheduled update completed');
      } catch (error) {
        console.error('❌ [CRON] Scheduled update failed:', error);
      }
    });
    
    // Job 2: Clean old items every 6 hours
    const cleanupJob = cron.schedule('0 */6 * * *', () => {
      console.log('🧹 [CRON] Running cleanup job...');
      try {
        const removed = newsStore.cleanOldItems();
        console.log(`✅ [CRON] Cleanup completed, removed ${removed} old items`);
      } catch (error) {
        console.error('❌ [CRON] Cleanup failed:', error);
      }
    });
    
    // Job 3: Quick refresh for Vietnam news every hour (lighter)
    const vietnamRefreshJob = cron.schedule('30 * * * *', async () => {
      console.log('🇻🇳 [CRON] Quick refresh for Vietnam news...');
      try {
        await newsStore.updateNewsForGroup('vietnam');
        console.log('✅ [CRON] Vietnam refresh completed');
      } catch (error) {
        console.error('❌ [CRON] Vietnam refresh failed:', error);
      }
    });
    
    // Job 4: Health check every 15 minutes (log cache status)
    const healthCheckJob = cron.schedule('*/15 * * * *', () => {
      const stats = newsStore.getStats();
      const uptime = this.getUptime();
      console.log('📊 [HEALTH] Cache Status:', {
        uptime,
        totalCached: stats.totalCached,
        groups: Object.entries(stats.groups).map(([key, val]) => 
          `${key}: ${val.itemCount} items (${val.cacheAge})`
        ),
        queueLength: stats.queueLength,
        isProcessing: stats.isProcessing
      });
    });
    
    this.jobs = [updateJob, cleanupJob, vietnamRefreshJob, healthCheckJob];
    this.isRunning = true;
    
    // Start all jobs
    this.jobs.forEach(job => job.start());
    
    // Initial load on startup
    this.runInitialLoad();
    
    console.log('✅ Scheduler started with 4 jobs:');
    console.log('  📌 Update all: Every 2 hours at :00');
    console.log('  📌 Cleanup: Every 6 hours at :00');
    console.log('  📌 Vietnam refresh: Every hour at :30');
    console.log('  📌 Health check: Every 15 minutes');
  }

  // Initial load with staggered timing
  async runInitialLoad() {
    console.log('🚀 Running initial news load...');
    
    // Initialize the store first
    await newsStore.initialize();
    
    // Log initial load schedule
    console.log('📅 Initial load schedule:');
    console.log('  - Vietnam: Starting in 1 second');
    console.log('  - International Economics: Starting in 15 seconds');
    console.log('  - International Tech: Starting in 30 seconds');
    console.log('  - All sources: Starting in 45 seconds');
    
    // Stagger initial loads to avoid overwhelming sources
    setTimeout(() => {
      console.log('🇻🇳 Loading Vietnam news...');
      newsStore.queueUpdate('vietnam');
    }, 1000);
    
    setTimeout(() => {
      console.log('🌐 Loading International Economics...');
      newsStore.queueUpdate('internationaleconomics');
    }, 15000);
    
    setTimeout(() => {
      console.log('💻 Loading International Tech...');
      newsStore.queueUpdate('internationaltech');
    }, 30000);
    
    setTimeout(() => {
      console.log('📰 Loading All sources...');
      newsStore.queueUpdate('all');
    }, 45000);
    
    // Check if all loaded after 2 minutes
    setTimeout(() => {
      const progress = newsStore.getLoadingProgress();
      if (progress.isComplete) {
        console.log('✅ Initial load completed successfully!');
      } else {
        console.log(`⏳ Initial load progress: ${progress.loaded}/${progress.total} groups loaded`);
      }
      
      const stats = newsStore.getStats();
      console.log('📊 Initial cache stats:', {
        totalItems: stats.totalCached,
        groups: Object.keys(stats.groups).length
      });
    }, 120000); // Check after 2 minutes
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 Stopping scheduler...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log('✅ Scheduler stopped');
  }

  // Force update (for manual trigger)
  async forceUpdate(group = 'all') {
    console.log(`🔄 Force updating ${group}...`);
    return await newsStore.updateNewsForGroup(group, [], true);
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: this.getUptime(),
      jobs: this.jobs.length,
      nextRuns: this.isRunning ? {
        updateAll: 'Every 2 hours at :00',
        cleanup: 'Every 6 hours at :00',
        vietnamRefresh: 'Every hour at :30',
        healthCheck: 'Every 15 minutes'
      } : null
    };
  }

  // Get uptime in human readable format
  getUptime() {
    if (!this.startTime) return 'Not started';
    
    const diff = Date.now() - this.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Manual refresh specific group
  async refreshGroup(group) {
    console.log(`🔄 Manual refresh requested for: ${group}`);
    
    if (!['all', 'vietnam', 'internationaleconomics', 'internationaltech'].includes(group)) {
      throw new Error(`Invalid group: ${group}`);
    }
    
    return await newsStore.queueUpdate(group);
  }

  // Get next run times
  getNextRunTimes() {
    const now = new Date();
    const next = {};
    
    // Calculate next update (every 2 hours at :00)
    const nextUpdate = new Date(now);
    nextUpdate.setHours(Math.ceil(now.getHours() / 2) * 2, 0, 0, 0);
    if (nextUpdate <= now) {
      nextUpdate.setHours(nextUpdate.getHours() + 2);
    }
    next.updateAll = nextUpdate;
    
    // Calculate next cleanup (every 6 hours at :00)
    const nextCleanup = new Date(now);
    nextCleanup.setHours(Math.ceil(now.getHours() / 6) * 6, 0, 0, 0);
    if (nextCleanup <= now) {
      nextCleanup.setHours(nextCleanup.getHours() + 6);
    }
    next.cleanup = nextCleanup;
    
    // Calculate next Vietnam refresh (every hour at :30)
    const nextVietnam = new Date(now);
    nextVietnam.setMinutes(30, 0, 0);
    if (nextVietnam <= now) {
      nextVietnam.setHours(nextVietnam.getHours() + 1);
    }
    next.vietnamRefresh = nextVietnam;
    
    return next;
  }
}

// Create singleton instance
export const scheduler = new NewsScheduler();

// Export for convenience
export default scheduler;