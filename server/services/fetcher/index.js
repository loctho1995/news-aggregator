import { config } from '../../config/index.js';
import { RSSFetcher } from './rss.fetcher.js';
import { HTMLFetcher } from './html.fetcher.js';

export class FetcherService {
  static async fetch(source, options = {}) {
    const maxRetries = options.maxRetries || config.retries[config.isLocal ? 'local' : 'production'];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Attempt ${attempt}/${maxRetries}] Fetching ${source.id}...`);
        
        let items;
        if (source.type === 'rss') {
          items = await RSSFetcher.fetch(source, options);
        } else if (source.type === 'html') {
          items = await HTMLFetcher.fetch(source, options);
        } else {
          throw new Error(`Unknown source type: ${source.type}`);
        }

        if (items && items.length > 0) {
          console.log(`✓ ${source.id}: Got ${items.length} items`);
          return items;
        }
      } catch (error) {
        console.error(`✗ ${source.id} attempt ${attempt}: ${error.message}`);
        
        if (attempt < maxRetries) {
          const delay = config.isLocal ? 500 : attempt * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`✗✗ ${source.id} failed after ${maxRetries} attempts`);
    return [];
  }
}