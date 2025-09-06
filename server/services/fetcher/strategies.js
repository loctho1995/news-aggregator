import { config } from '../../config/index.js';

export class FetchStrategies {
  static async fetchWithRetry(url, isMobile = false) {
    const isVnExpress = url.includes('vnexpress.net');
    const timeout = this.getTimeout(isMobile, isVnExpress);
    
    const strategies = [
      () => this.directFetch(url, timeout, isMobile),
      () => this.mobileFetch(url, timeout),
      () => this.proxyFetch(url, timeout, 'allorigins'),
      () => this.proxyFetch(url, timeout, 'jina')
    ];

    let lastError = null;
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Strategy ${i + 1}/${strategies.length} for ${url}`);
        
        const html = await strategies[i]();
        
        if (html && html.length > 1000) {
          // Validate content
          if (this.isBlocked(html)) {
            console.log(`Strategy ${i + 1} was blocked`);
            continue;
          }
          
          if (isVnExpress && !this.hasVnExpressContent(html)) {
            console.log(`Strategy ${i + 1} - No VnExpress content`);
            continue;
          }
          
          console.log(`✓ Strategy ${i + 1} successful`);
          return html;
        }
      } catch (error) {
        console.log(`✗ Strategy ${i + 1} failed: ${error.message}`);
        lastError = error;
        
        // Delay between retries
        if (i < strategies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    throw lastError || new Error('All fetch strategies failed');
  }

  static getTimeout(isMobile, isVnExpress) {
    if (isVnExpress) {
      return config.timeouts.summary.vnexpress;
    }
    return isMobile 
      ? config.timeouts.summary.mobile 
      : config.timeouts.summary.desktop;
  }

  static async directFetch(url, timeout, isMobile) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  }

  static async mobileFetch(url, timeout) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) Chrome/120.0.0.0 Mobile',
        'Accept': 'text/html,*/*'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  }

  static async proxyFetch(url, timeout, proxyType) {
    let proxyUrl;
    
    switch (proxyType) {
      case 'allorigins':
        proxyUrl = `${config.apis.proxy.allorigins}?url=${encodeURIComponent(url)}`;
        break;
      case 'codetabs':
        proxyUrl = `${config.apis.proxy.codetabs}?quest=${encodeURIComponent(url)}`;
        break;
      case 'jina':
        const cleanUrl = url.replace(/^https?:\/\//, '');
        proxyUrl = `${config.apis.proxy.jina}/${cleanUrl}`;
        break;
      default:
        throw new Error('Unknown proxy type');
    }

    const response = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(timeout + 3000)
    });

    if (!response.ok) {
      throw new Error(`Proxy HTTP ${response.status}`);
    }

    const content = await response.text();
    
    // For Jina, convert to HTML
    if (proxyType === 'jina') {
      return this.convertTextToHTML(content);
    }
    
    return content;
  }

  static convertTextToHTML(text) {
    const paragraphs = text
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/[<>]/g, '')}</p>`)
      .join('');
    
    return `<html><body><article>${paragraphs}</article></body></html>`;
  }

  static isBlocked(html) {
    const blockedPatterns = [
      'cf-browser-verification',
      'Just a moment',
      'Access Denied',
      '403 Forbidden'
    ];
    
    return blockedPatterns.some(pattern => html.includes(pattern));
  }

  static hasVnExpressContent(html) {
    const contentIndicators = [
      'fck_detail',
      'Normal',
      'article-content',
      'description',
      'vnexpress'
    ];
    
    return contentIndicators.some(indicator => html.includes(indicator));
  }
}