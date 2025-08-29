// server/services/aggregator/index.js
import dayjs from "dayjs";
import { SOURCES } from "../../constants/sources.js";
import { fetchRSSWithFullContent } from "./rss-fetcher.js";
import { fetchHTMLWithFullContent } from "./html-fetcher.js";
import { DEFAULT_TZ } from "./utils.js";

// Main fetch function
async function fetchFromSource(sourceId) {
  const source = SOURCES[sourceId];
  if (!source) throw new Error("Unknown source: " + sourceId);
  
  try {
    if (source.type === "rss") {
      return await fetchRSSWithFullContent(source);
    } else if (source.type === "html") {
      return await fetchHTMLWithFullContent(source);
    }
  } catch (e) {
    console.error(`Error with source ${sourceId}: ${e.message}`);
    return [];
  }
}

// Streaming version
export async function fetchAllStreaming({ 
  include = [], 
  hours = 24, 
  limitPerSource = 30, 
  group = null, 
  onItem 
} = {}) {
  // Filter sources by group if specified
  let ids;
  if (include.length) {
    ids = include;
  } else if (group) {
    ids = Object.keys(SOURCES).filter(id => SOURCES[id].group === group);
  } else {
    ids = Object.keys(SOURCES);
  }
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  const seen = new Set();
  
  // Process sources in parallel but emit items as soon as available
  const promises = ids.map(async (id) => {
    try {
      console.log(`Fetching from ${id}...`);
      const items = await fetchFromSource(id);
      
      // Process and emit each item immediately
      for (const item of items) {
        // Check time filter
        if (item.publishedAt) {
          const t = dayjs(item.publishedAt);
          if (t.isValid() && !t.isAfter(since)) continue;
        }
        
        // Check duplicate
        if (seen.has(item.link)) continue;
        seen.add(item.link);
        
        // Add group info
        item.group = SOURCES[id].group || 'vietnam';
        item.categories = (item.categories || []).map(x => String(x).trim()).filter(Boolean);
        
        // Emit item immediately
        if (onItem) {
          onItem(item);
        }
      }
    } catch (e) {
      console.error(`Source ${id} failed: ${e.message}`);
      // Send error item but don't stop
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
  
  // Wait for all to complete
  await Promise.allSettled(promises);
}

// Batch version
export async function fetchAll({ 
  include = [], 
  hours = 24, 
  limitPerSource = 30, 
  group = null 
} = {}) {
  // Filter sources by group if specified
  let ids;
  if (include.length) {
    ids = include;
  } else if (group) {
    ids = Object.keys(SOURCES).filter(id => SOURCES[id].group === group);
  } else {
    ids = Object.keys(SOURCES);
  }
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  
  // Fetch song song nhưng giới hạn concurrent
  const batchSize = 3; // Xử lý 3 nguồn cùng lúc
  const results = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchPromises = batch.map(async (id) => {
      try {
        const items = await fetchFromSource(id);
        const filtered = items
          .filter((it) => {
            if (!it.publishedAt) return true;
            const t = dayjs(it.publishedAt);
            return t.isValid() ? t.isAfter(since) : true;
          })
          .slice(0, limitPerSource);
        
        // Add group info to each item
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
  
  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const it of results) {
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
  
  return deduped;
}

export function listSources() {
  return Object.values(SOURCES).map(({ id, name, homepage, url, type, group }) => ({ 
    id, name, homepage, url, type, group: group || 'vietnam'
  }));
}