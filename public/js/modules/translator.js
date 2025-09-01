// public/js/modules/translator.js

// Cache for translated texts
const translationCache = new Map();
const MAX_CACHE = 200;

function getCached(key) {
  return translationCache.get(key);
}

function setCache(key, value) {
  if (translationCache.size >= MAX_CACHE) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}

// Single translation (giữ lại cho backward compatibility)
export async function translateToVietnamese(text) {
  if (!text) return "";
  
  // Check cache
  const cacheKey = `single:${text.slice(0, 100)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  try {
    const resp = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target: "vi" })
    });
    const data = await resp.json();
    const result = data.translatedText || text;
    setCache(cacheKey, result);
    return result;
  } catch {
    return text;
  }
}

// BATCH translation - GỌI 1 LẦN DUY NHẤT
export async function translateMany(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  
  // If only 1 item, use single translate
  if (arr.length === 1) {
    const translated = await translateToVietnamese(arr[0]);
    return [translated];
  }
  
  console.log(`Batch translating ${arr.length} texts`);
  
  try {
    const resp = await fetch("/api/translate-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        texts: arr,
        target: "vi" 
      }),
      signal: AbortSignal.timeout(20000) // 20s timeout for batch
    });
    
    if (!resp.ok) {
      console.warn("Batch translate failed with status:", resp.status);
      // Don't fallback to individual calls - just return original
      return arr;
    }
    
    const data = await resp.json();
    console.log(`Batch translate completed: ${data.cached ? 'from cache' : 'fresh'}`);
    return data.translatedTexts || arr;
    
  } catch (e) {
    console.error("Batch translate error:", e);
    // Don't fallback to individual calls - just return original
    return arr;
  }
}

// NEW: Batch translate multiple items at once
export async function batchTranslateItems(items) {
  if (!items || items.length === 0) return items;
  
  console.log(`Batch translating ${items.length} items`);
  
  // Collect all texts from all items
  const allTexts = [];
  const textMapping = [];
  
  items.forEach((item, itemIndex) => {
    const itemTexts = {
      itemIndex,
      titleIndex: -1,
      descriptionIndex: -1,
      summaryIndex: -1,
      bulletsStart: -1,
      bulletsCount: 0
    };
    
    // Add title
    if (item.title) {
      itemTexts.titleIndex = allTexts.length;
      allTexts.push(item.title);
    }
    
    // Add description
    if (item.description) {
      itemTexts.descriptionIndex = allTexts.length;
      allTexts.push(item.description);
    }
    
    // Add summary
    if (item.summary) {
      itemTexts.summaryIndex = allTexts.length;
      allTexts.push(item.summary);
    }
    
    // Add bullets
    if (item.bullets && Array.isArray(item.bullets)) {
      itemTexts.bulletsStart = allTexts.length;
      itemTexts.bulletsCount = item.bullets.length;
      item.bullets.forEach(bullet => allTexts.push(bullet));
    }
    
    textMapping.push(itemTexts);
  });
  
  // Nothing to translate
  if (allTexts.length === 0) return items;
  
  try {
    // SINGLE BATCH CALL for all texts from all items
    console.log(`Calling translate-batch with ${allTexts.length} texts from ${items.length} items`);
    
    const resp = await fetch("/api/translate-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        texts: allTexts,
        target: "vi" 
      }),
      signal: AbortSignal.timeout(30000) // 30s timeout for large batch
    });
    
    if (!resp.ok) {
      console.warn(`Batch translate failed: ${resp.status}`);
      return items; // Return original items
    }
    
    const data = await resp.json();
    const translatedTexts = data.translatedTexts || allTexts;
    
    console.log(`Batch translate successful: ${data.cached ? 'cached' : 'fresh'}, ${data.fallback ? 'with fallback' : 'direct'}`);
    
    // Map translated texts back to items
    const translatedItems = items.map((item, index) => {
      const mapping = textMapping[index];
      const translatedItem = { ...item };
      
      if (mapping.titleIndex >= 0) {
        translatedItem.title = translatedTexts[mapping.titleIndex] || item.title;
      }
      
      if (mapping.descriptionIndex >= 0) {
        translatedItem.description = translatedTexts[mapping.descriptionIndex] || item.description;
      }
      
      if (mapping.summaryIndex >= 0) {
        translatedItem.summary = translatedTexts[mapping.summaryIndex] || item.summary;
      }
      
      if (mapping.bulletsStart >= 0 && mapping.bulletsCount > 0) {
        translatedItem.bullets = [];
        for (let i = 0; i < mapping.bulletsCount; i++) {
          translatedItem.bullets.push(
            translatedTexts[mapping.bulletsStart + i] || item.bullets[i]
          );
        }
      }
      
      translatedItem.translated = true;
      return translatedItem;
    });
    
    return translatedItems;
    
  } catch (e) {
    console.error("Batch translate items error:", e);
    return items; // Return original items
  }
}

// Helper để translate 1 item (dùng batch cho efficiency)
export async function translateItemIfNeeded(item) {
  try {
    if (!item || !["internationaleconomics","internationaltech"].includes(item.group)) {
      return item;
    }
    
    // Use batch translate for single item
    const translated = await batchTranslateItems([item]);
    return translated[0] || item;
    
  } catch (e) {
    console.error("translateItemIfNeeded error:", e);
    return item;
  }
}