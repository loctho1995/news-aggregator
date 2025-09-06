import dayjs from 'dayjs';
import { config } from '../config/index.js';
import { getSortedSourceIds, getSourceById } from '../config/sources.js';
import { FetcherService } from './fetcher/index.js';

export class NewsService {
  static async fetchNews({ sources = [], hours = 24, limit = null, group = null }) {
    const sourceIds = sources.length ? sources : getSortedSourceIds(group);
    const since = dayjs().subtract(hours, 'hour');
    const itemLimit = limit || config.limits.itemsPerSource[config.isLocal ? 'local' : 'production'];
    
    const results = [];
    const seen = new Set();

    for (const sourceId of sourceIds) {
      try {
        const source = getSourceById(sourceId);
        if (!source) continue;

        const items = await FetcherService.fetch(source);
        
        const filtered = items
          .filter(item => {
            if (seen.has(item.link)) return false;
            seen.add(item.link);
            
            if (!item.publishedAt) return true;
            const publishDate = dayjs(item.publishedAt);
            return publishDate.isValid() ? publishDate.isAfter(since) : true;
          })
          .slice(0, itemLimit)
          .map(item => ({
            ...item,
            group: source.group || 'vietnam'
          }));

        results.push(...filtered);
      } catch (error) {
        console.error(`Failed to fetch ${sourceId}:`, error.message);
      }
    }

    // Sort by date
    results.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return results;
  }

  static async streamNews({ sources = [], hours = 24, limit = null, group = null }, onItem) {
    const sourceIds = sources.length ? sources : getSortedSourceIds(group);
    const since = dayjs().subtract(hours, 'hour');
    const itemLimit = limit || config.limits.itemsPerSource[config.isLocal ? 'local' : 'production'];
    
    const seen = new Set();
    let totalFetched = 0;

    // Process in batches for local, sequential for production
    if (config.isLocal) {
      await this.streamParallel(sourceIds, since, itemLimit, seen, onItem);
    } else {
      await this.streamSequential(sourceIds, since, itemLimit, seen, onItem);
    }

    console.log(`Stream complete: ${totalFetched} items fetched`);
  }

  static async streamParallel(sourceIds, since, itemLimit, seen, onItem) {
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < sourceIds.length; i += BATCH_SIZE) {
      const batch = sourceIds.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(
        batch.map(sourceId => this.processSource(sourceId, since, itemLimit, seen, onItem))
      );
    }
  }

  static async streamSequential(sourceIds, since, itemLimit, seen, onItem) {
    for (const sourceId of sourceIds) {
      await this.processSource(sourceId, since, itemLimit, seen, onItem);
      // Small delay between sources on production
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  static async processSource(sourceId, since, itemLimit, seen, onItem) {
    try {
      const source = getSourceById(sourceId);
      if (!source) return;

      const items = await FetcherService.fetch(source);
      
      for (const item of items.slice(0, itemLimit)) {
        if (item.publishedAt) {
          const publishDate = dayjs(item.publishedAt);
          if (publishDate.isValid() && !publishDate.isAfter(since)) continue;
        }
        
        if (seen.has(item.link)) continue;
        seen.add(item.link);
        
        item.group = source.group || 'vietnam';
        
        if (onItem) {
          onItem(item);
        }
      }
    } catch (error) {
      console.error(`Source ${sourceId} failed:`, error.message);
      
      if (onItem) {
        onItem({
          error: true,
          sourceId,
          message: error.message,
          group: getSourceById(sourceId)?.group || 'vietnam'
        });
      }
    }
  }
}