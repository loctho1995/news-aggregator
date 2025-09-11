// server/services/aggregator/index.js
// UNIVERSAL VERSION - Works on both LOCAL and SERVER

import dayjs from "dayjs";
import { SOURCES } from "../../constants/sources.js";
import { fetchRSSWithFullContent } from "./rss-fetcher.js";
import { fetchHTMLWithFullContent } from "./html-fetcher.js";
import { DEFAULT_TZ } from "./utils.js";

// Check environment
const isLocal = process.env.NODE_ENV !== 'production' || 
                process.env.LOCAL_DEV === 'true' ||
                !process.env.PORT;

console.log(`Running in ${isLocal ? 'LOCAL' : 'PRODUCTION'} mode`);

  // Priority sources
const PRIORITY_SOURCES = {
  high: ['vnexpress', 'tuoitre', 'dantri', 'vietnamnet', 'cafef', 
         'hackernews', 'techcrunch', 'smashingmagazine', 'polygon'],
  medium: ['thanhnien', 'laodong', 'cafebiz', 'vietstock',
          'infoq', 'gamedeveloper', 'uxdesign', 'ign'],
  low: ['baophapluat', 'bnews', 'vnbusiness', 'brandsvietnam',
        'mockplus', 'designshack', 'pocketgamer']
};

// Fetch with retry (different config for local vs server)
async function fetchWithRetryAndTimeout(sourceId, maxRetries = null) {
  const source = SOURCES[sourceId];
  if (!source) throw new Error("Unknown source: " + sourceId);
  
  // Different settings for local vs server
  const retries = maxRetries || (isLocal ? 1 : 2);
  const timeouts = {
    rss: isLocal ? 10000 : 15000,
    html: isLocal ? 10000 : 20000
  };
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/${retries}] Fetching ${sourceId}...`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, timeouts[source.type] || 10000);
      
      let items = [];
      
      try {
        if (source.type === "rss") {
          items = await fetchRSSWithFullContent(source, controller.signal);
        } else {
          items = await fetchHTMLWithFullContent(source, controller.signal);
        }
      } finally {
        clearTimeout(timeout);
      }
      
      if (items && items.length > 0) {
        console.log(`✓ ${sourceId}: Got ${items.length} items`);
        return items;
      }
      
    } catch (e) {
      console.error(`✗ ${sourceId} attempt ${attempt}: ${e.message}`);
      
      // Wait before retry (shorter for local)
      if (attempt < retries) {
        const waitTime = isLocal ? 500 : attempt * 2000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`✗✗ ${sourceId} failed after ${retries} attempts`);
  return [];
}

// STREAMING VERSION
export async function fetchAllStreaming({ 
  include = [], 
  hours = 24, 
  limitPerSource = null, 
  group = null, 
  onItem 
} = {}) {
  // Default limits based on environment
  const itemLimit = limitPerSource || (isLocal ? 30 : 15);
  
  let ids;
  if (include.length) {
    ids = include;
  } else if (group) {
    ids = Object.keys(SOURCES).filter(id => SOURCES[id].group === group);
  } else {
    ids = Object.keys(SOURCES);
  }
  
  // Sort by priority
  ids.sort((a, b) => {
    const getPriority = (id) => {
      if (PRIORITY_SOURCES.high.includes(id)) return 0;
      if (PRIORITY_SOURCES.medium.includes(id)) return 1;
      if (PRIORITY_SOURCES.low.includes(id)) return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });
  
  console.log(`Starting fetch for ${ids.length} sources (${isLocal ? 'LOCAL' : 'SERVER'} mode)`);
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  const seen = new Set();
  let totalFetched = 0;
  let successfulSources = 0;
  let failedSources = [];
  
  // LOCAL: Can fetch in parallel
  if (isLocal) {
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (id) => {
        try {
          const items = await fetchWithRetryAndTimeout(id);
          
          if (items.length > 0) {
            successfulSources++;
            
            for (const item of items.slice(0, itemLimit)) {
              if (item.publishedAt) {
                const t = dayjs(item.publishedAt);
                if (t.isValid() && !t.isAfter(since)) continue;
              }
              
              if (seen.has(item.link)) continue;
              seen.add(item.link);
              
              item.group = SOURCES[id].group || 'vietnam';
              item.categories = (item.categories || []).map(x => String(x).trim()).filter(Boolean);
              
              if (onItem) {
                onItem(item);
                totalFetched++;
              }
            }
          } else {
            failedSources.push(id);
          }
        } catch (e) {
          console.error(`Failed to process ${id}: ${e.message}`);
          failedSources.push(id);
          
          if (onItem) {
            onItem({ 
              error: true, 
              sourceId: id, 
              message: e.message,
              group: SOURCES[id]?.group || 'vietnam'
            });
          }
        }
      });
      
      await Promise.allSettled(batchPromises);
    }
  } 
  // SERVER: Sequential to avoid overload
  else {
    for (const id of ids) {
      try {
        // Skip low priority if have enough
        if (totalFetched > 40 && PRIORITY_SOURCES.low.includes(id)) {
          console.log(`Skipping low-priority ${id}`);
          continue;
        }
        
        const items = await fetchWithRetryAndTimeout(id);
        
        if (items.length === 0) {
          failedSources.push(id);
          continue;
        }
        
        successfulSources++;
        
        for (const item of items.slice(0, itemLimit)) {
          if (item.publishedAt) {
            const t = dayjs(item.publishedAt);
            if (t.isValid() && !t.isAfter(since)) continue;
          }
          
          if (seen.has(item.link)) continue;
          seen.add(item.link);
          
          item.group = SOURCES[id].group || 'vietnam';
          item.categories = (item.categories || []).map(x => String(x).trim()).filter(Boolean);
          
          if (onItem) {
            onItem(item);
            totalFetched++;
          }
        }
        
        // Delay between sources on server
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (e) {
        console.error(`Failed to process ${id}: ${e.message}`);
        failedSources.push(id);
        
        if (onItem) {
          onItem({ 
            error: true, 
            sourceId: id, 
            message: e.message,
            group: SOURCES[id]?.group || 'vietnam'
          });
        }
      }
    }
  }
  
  console.log(`
    ========== FETCH SUMMARY ==========
    Mode: ${isLocal ? 'LOCAL' : 'SERVER'}
    ✓ Successful: ${successfulSources} sources
    ✗ Failed: ${failedSources.length} sources
    📰 Total items: ${totalFetched}
    ===================================
  `);
}

// BATCH VERSION
export async function fetchAll({ 
  include = [], 
  hours = 24, 
  limitPerSource = null,
  group = null 
} = {}) {
  const itemLimit = limitPerSource || (isLocal ? 30 : 15);
  
  let ids;
  if (include.length) {
    ids = include;
  } else if (group) {
    ids = Object.keys(SOURCES).filter(id => SOURCES[id].group === group);
  } else {
    ids = Object.keys(SOURCES);
  }
  
  // Sort by priority
  ids.sort((a, b) => {
    const getPriority = (id) => {
      if (PRIORITY_SOURCES.high.includes(id)) return 0;
      if (PRIORITY_SOURCES.medium.includes(id)) return 1;
      if (PRIORITY_SOURCES.low.includes(id)) return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  const results = [];
  
  console.log(`Batch fetching ${ids.length} sources (${isLocal ? 'LOCAL' : 'SERVER'} mode)`);
  
  // LOCAL: Parallel fetching
  if (isLocal) {
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (id) => {
        try {
          const items = await fetchWithRetryAndTimeout(id);
          
          const filtered = items
            .filter((it) => {
              if (!it.publishedAt) return true;
              const t = dayjs(it.publishedAt);
              return t.isValid() ? t.isAfter(since) : true;
            })
            .slice(0, itemLimit);
          
          filtered.forEach(item => {
            item.group = SOURCES[id].group || 'vietnam';
          });
          
          return filtered;
        } catch (e) {
          console.error(`Source ${id} failed: ${e.message}`);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
    }
  }
  // SERVER: Sequential fetching  
  else {
    for (const id of ids) {
      try {
        const items = await fetchWithRetryAndTimeout(id);
        
        const filtered = items
          .filter((it) => {
            if (!it.publishedAt) return true;
            const t = dayjs(it.publishedAt);
            return t.isValid() ? t.isAfter(since) : true;
          })
          .slice(0, itemLimit);
        
        filtered.forEach(item => {
          item.group = SOURCES[id].group || 'vietnam';
        });
        
        results.push(...filtered);
        console.log(`✓ ${id}: Added ${filtered.length} items`);
        
        // Small delay on server
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (e) {
        console.error(`Source ${id} failed: ${e.message}`);
      }
    }
  }
  
  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const it of results.flat()) {
    if (!it.link || seen.has(it.link)) continue;
    seen.add(it.link);
    it.categories = (it.categories || []).map(x => String(x).trim()).filter(Boolean);
    deduped.push(it);
  }
  
  // Sort by date
  deduped.sort((a, b) => {
    const ta = a.publishedAt ? +new Date(a.publishedAt) : 0;
    const tb = b.publishedAt ? +new Date(b.publishedAt) : 0;
    return tb - ta;
  });
  
  console.log(`Total fetched: ${deduped.length} unique items`);
  return deduped;
}

export function listSources() {
  return Object.values(SOURCES).map(({ id, name, homepage, url, type, group }) => ({ 
    id, name, homepage, url, type, group: group || 'vietnam'
  }));
}