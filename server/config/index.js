// Main configuration file
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isLocal: !process.env.PORT || process.env.LOCAL_DEV === 'true',
  
  // Timeouts
  timeouts: {
    rss: {
      local: 10000,
      production: 15000
    },
    html: {
      local: 10000,
      production: 20000
    },
    summary: {
      mobile: 15000,
      desktop: 20000,
      vnexpress: 25000
    },
    translate: 5000
  },
  
  // Retry settings
  retries: {
    local: 1,
    production: 2
  },
  
  // Cache TTLs (ms)
  cache: {
    summary: 30 * 60 * 1000,        // 30 minutes
    mobileSummary: 60 * 60 * 1000,  // 1 hour
    translation: 24 * 60 * 60 * 1000, // 24 hours
    error: 2 * 60 * 60 * 1000        // 2 hours
  },
  
  // Limits
  limits: {
    itemsPerSource: {
      local: 30,
      production: 15
    },
    maxSummaryLength: 2000,
    maxBulletLength: 800,
    maxBullets: 5
  },
  
  // API endpoints
  apis: {
    translation: {
      mymemory: 'https://api.mymemory.translated.net/get',
      google_gtx: 'https://translate.googleapis.com/translate_a/single',
      google_clients5: 'https://clients5.google.com/translate_a/t'
    },
    proxy: {
      allorigins: 'https://api.allorigins.win/raw',
      codetabs: 'https://api.codetabs.com/v1/proxy',
      jina: 'https://r.jina.ai'
    }
  }
};

export default config;