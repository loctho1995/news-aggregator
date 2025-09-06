import { VnExpressExtractor } from './vnexpress.extractor.js';
import { GenericExtractor } from './generic.extractor.js';

export class ContentExtractor {
  static extract($, url) {
    // Check for specific extractors
    if (this.isVnExpress(url)) {
      return VnExpressExtractor.extract($);
    }
    
    // Add more specific extractors here
    // if (this.isTuoiTre(url)) return TuoiTreExtractor.extract($);
    
    // Default to generic extractor
    return GenericExtractor.extract($);
  }

  static isVnExpress(url) {
    return url.includes('vnexpress.net');
  }
}