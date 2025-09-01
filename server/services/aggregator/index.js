// server/services/aggregator/index.js
// UNIVERSAL VERSION - Works on both LOCAL and SERVER
// PRIORITY ORDER: Tech International → Vietnam → International Economics

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

// Priority sources - TECH FIRST, VIETNAM SECOND, ECONOMICS LAST
const PRIORITY_SOURCES = {
  // Tech international - HIGHEST PRIORITY
  tech_high: ['techcrunch', 'theverge', 'wired', 'arstechnica'],
  tech_medium: ['gizmodo', 'bleepingcomputer', 'slashdot', 'thenextweb'],
  tech_low: ['zdnet', 'techradar', 'engadget', 'theregister'],
  
  // Vietnam news - SECOND PRIORITY  
  vietnam_high: ['vnexpress', 'tuoitre', 'dantri', 'vietnamnet', 'cafef'],
  vietnam_medium: ['thanhnien', 'laodong', 'cafebiz', 'vietstock'],
  vietnam_low: ['baophapluat', 'bnews', 'vnbusiness', 'brandsvietnam'],
  
  // International economics - LOWEST PRIORITY
  econ_high: ['wsj', 'economist', 'reuters', 'cnbc', 'marketwatch'],
  econ_medium: ['bbc_business', 'guardian_economics', 'marketwatch_economy'],
  econ_low: ['investing_economy', 'voxeu', 'imf_news', 'wto_news']
};

// Helper function to get priority score (LOWER is BETTER)
function getPriorityScore(sourceId) {
  const source = SOURCES[sourceId];
  if (!source) return 999;
  
  // Tech international gets highest priority (lowest score)
  if (source.group === 'internationaltech') {
    if (PRIORITY_SOURCES.tech_high.includes(sourceId)) return 0;
    if (PRIORITY_SOURCES.tech_medium.includes(sourceId)) return 1;
    if (PRIORITY_SOURCES.tech_low.includes(sourceId)) return 2;
    return 3; // Other tech sources
  }
  
  // Vietnam news gets second priority
  if (source.group === 'vietnam') {
    if (PRIORITY_SOURCES.vietnam_high.includes(sourceId)) return 10;
    if (PRIORITY_SOURCES.vietnam_medium.includes(sourceId)) return 11;
    if (PRIORITY_SOURCES.vietnam_low.includes(sourceId)) return 12;
    return 13; // Other Vietnam sources
  }
  
  // International economics gets lowest priority
  if (source.group === 'internationaleconomics') {
    if (PRIORITY_SOURCES.econ_high.includes(sourceId)) return 20;
    if (PRIORITY_SOURCES.econ_medium.includes(sourceId)) return 21;
    if (PRIORITY_SOURCES.econ_low.includes(sourceId)) return 22;
    return 23; // Other econ sources
  }
  
  return 999; // Unknown group
}

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
      console.log(`[Attempt ${attempt}/${retries}] Fetching ${sourceId} (${source.group})...`);
      
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
        console.log(`✓ ${sourceId} (${source.group}): Got ${items.length} items`);
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

// STREAMING VERSION with priority: Tech → Vietnam → Economics
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
  
  // SORT BY PRIORITY: Tech → Vietnam → Economics
  ids.sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
  
  console.log(`Starting fetch for ${ids.length} sources (${isLocal ? 'LOCAL' : 'SERVER'} mode)`);
  console.log(`Priority order: Tech International → Vietnam → International Economics`);
  
  // Debug: Log first 10 sources to verify order
  console.log('First 10 sources in order:', ids.slice(0, 10).map(id => `${id}(${SOURCES[id].group})`));
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  const seen = new Set();
  let totalFetched = 0;
  let successfulSources = 0;
  let failedSources = [];
  
  // Track by group for logging
  const groupCounts = {
    internationaltech: 0,
    vietnam: 0,
    internationaleconomics: 0
  };
  
  // LOCAL: Can fetch in parallel within groups
  if (isLocal) {
    const BATCH_SIZE = 3;
    
    // Group sources by priority group for better control
    const techSources = ids.filter(id => SOURCES[id].group === 'internationaltech');
    const vietnamSources = ids.filter(id => SOURCES[id].group === 'vietnam');
    const econSources = ids.filter(id => SOURCES[id].group === 'internationaleconomics');
    
    console.log(`Groups: Tech(${techSources.length}), Vietnam(${vietnamSources.length}), Econ(${econSources.length})`);
    
    // Process each group in order: Tech → Vietnam → Economics
    for (const [groupName, sourceGroup] of [
      ['Tech International', techSources],
      ['Vietnam', vietnamSources],
      ['International Economics', econSources]
    ]) {
      if (sourceGroup.length === 0) continue;
      
      console.log(`\n=== Processing ${groupName} (${sourceGroup.length} sources) ===`);
      
      for (let i = 0; i < sourceGroup.length; i += BATCH_SIZE) {
        const batch = sourceGroup.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (id) => {
          try {
            const items = await fetchWithRetryAndTimeout(id);
            
            if (items.length > 0) {
              successfulSources++;
              const sourceGroup = SOURCES[id].group || 'vietnam';
              
              for (const item of items.slice(0, itemLimit)) {
                if (item.publishedAt) {
                  const t = dayjs(item.publishedAt);
                  if (t.isValid() && !t.isAfter(since)) continue;
                }
                
                if (seen.has(item.link)) continue;
                seen.add(item.link);
                
                item.group = sourceGroup;
                item.categories = (item.categories || []).map(x => String(x).trim()).filter(Boolean);
                
                if (onItem) {
                  onItem(item);
                  totalFetched++;
                  groupCounts[sourceGroup]++;
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
  } 
  // SERVER: Sequential to avoid overload, but respect priority
  else {
    for (const id of ids) {
      try {
        const source = SOURCES[id];
        const sourceGroup = source.group || 'vietnam';
        
        // Skip low priority economics sources if we have enough
        if (totalFetched > 40 && sourceGroup === 'internationaleconomics' && 
            PRIORITY_SOURCES.econ_low.includes(id)) {
          console.log(`Skipping low-priority economics source ${id}`);
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
          
          item.group = sourceGroup;
          item.categories = (item.categories || []).map(x => String(x).trim()).filter(Boolean);
          
          if (onItem) {
            onItem(item);
            totalFetched++;
            groupCounts[sourceGroup]++;
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
    Priority: Tech → Vietnam → Economics
    ✓ Successful: ${successfulSources} sources
    ✗ Failed: ${failedSources.length} sources
    📰 Total items: ${totalFetched}
    
    By Group:
    - Tech International: ${groupCounts.internationaltech} items
    - Vietnam: ${groupCounts.vietnam} items  
    - International Economics: ${groupCounts.internationaleconomics} items
    ===================================
  `);
}

// BATCH VERSION with priority
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
  
  // SORT BY PRIORITY: Tech → Vietnam → Economics
  ids.sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  const results = [];
  
  console.log(`Batch fetching ${ids.length} sources (${isLocal ? 'LOCAL' : 'SERVER'} mode)`);
  console.log(`Priority: Tech International → Vietnam → International Economics`);
  
  // LOCAL: Parallel fetching within groups
  if (isLocal) {
    const BATCH_SIZE = 3;
    
    // Group sources by priority
    const techSources = ids.filter(id => SOURCES[id].group === 'internationaltech');
    const vietnamSources = ids.filter(id => SOURCES[id].group === 'vietnam');
    const econSources = ids.filter(id => SOURCES[id].group === 'internationaleconomics');
    
    // Process each group in order: Tech → Vietnam → Economics
    for (const [groupName, sourceGroup] of [
      ['Tech International', techSources],
      ['Vietnam', vietnamSources],
      ['International Economics', econSources]
    ]) {
      if (sourceGroup.length === 0) continue;
      
      console.log(`Fetching ${sourceGroup.length} ${groupName} sources`);
      
      for (let i = 0; i < sourceGroup.length; i += BATCH_SIZE) {
        const batch = sourceGroup.slice(i, i + BATCH_SIZE);
        
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
  }
  // SERVER: Sequential fetching with priority
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
        console.log(`✓ ${id} (${SOURCES[id].group}): Added ${filtered.length} items`);
        
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
  
  // Sort by date (newest first) but maintain some group priority
  deduped.sort((a, b) => {
    // If both are from same group, sort by date
    if (a.group === b.group) {
      const ta = a.publishedAt ? +new Date(a.publishedAt) : 0;
      const tb = b.publishedAt ? +new Date(b.publishedAt) : 0;
      return tb - ta;
    }
    
    // Otherwise, maintain group priority for recent items
    const ta = a.publishedAt ? +new Date(a.publishedAt) : 0;
    const tb = b.publishedAt ? +new Date(b.publishedAt) : 0;
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    // If both are recent (within 1 hour), keep group priority
    if (ta > hourAgo && tb > hourAgo) {
      return getPriorityScore(a.sourceId || '') - getPriorityScore(b.sourceId || '');
    }
    
    // Otherwise sort by date
    return tb - ta;
  });
  
  console.log(`Total fetched: ${deduped.length} unique items`);
  
  // Log group distribution
  const groupDist = {};
  deduped.forEach(item => {
    groupDist[item.group] = (groupDist[item.group] || 0) + 1;
  });
  console.log('Distribution:', groupDist);
  
  return deduped;
}

export function listSources() {
  return Object.values(SOURCES).map(({ id, name, homepage, url, type, group }) => ({ 
    id, name, homepage, url, type, group: group || 'vietnam'
  }));
}