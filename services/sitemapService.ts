
import { SitemapEntry, SitemapData } from "../types";

/**
 * Helper to extract URLs from text content (XML or plain text)
 */
const extractUrlsFromContent = (textContent: string): string[] => {
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls: string[] = [];
  let match;

  while ((match = urlRegex.exec(textContent)) !== null) {
    if (match[1]) {
      urls.push(match[1].trim());
    }
  }

  if (urls.length === 0) {
    if (!textContent.includes('<xml') && !textContent.includes('<urlset') && !textContent.includes('<sitemapindex') && !textContent.includes('<!DOCTYPE html>')) {
      const lines = textContent.split(/\r?\n/);
      const validUrl = /^(http|https):\/\//;
      lines.forEach(line => {
        const trimmed = line.trim();
        if (validUrl.test(trimmed)) {
          urls.push(trimmed);
        }
      });
    }
  }
  return urls;
};

const isSitemapUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return lower.endsWith('.xml') || 
         lower.endsWith('.xml.gz') || 
         lower.endsWith('.gz') ||
         lower.includes('sitemap');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const parseSitemapFile = async (file: File): Promise<string[]> => {
  let textContent = '';
  try {
    if (file.name.endsWith('.gz') || file.type === 'application/gzip' || file.type === 'application/x-gzip') {
      if ('DecompressionStream' in window) {
        const ds = new DecompressionStream('gzip');
        const decompressedStream = file.stream().pipeThrough(ds);
        const response = new Response(decompressedStream);
        textContent = await response.text();
      } else {
        throw new Error("Your browser does not support native GZIP decompression.");
      }
    } else {
      textContent = await file.text();
    }
    return extractUrlsFromContent(textContent);
  } catch (error) {
    console.error("Error parsing sitemap file:", error);
    throw error;
  }
};

/**
 * Fetches a sitemap from a URL.
 * Includes a User-Agent header to spoof a browser (where allowed by CORS/Proxy).
 */
export const fetchSitemapFromUrl = async (url: string): Promise<string[]> => {
  
  const performFetch = async (targetUrl: string) => {
    // Attempt to set a User-Agent. 
    // We send a common browser User-Agent to try and bypass basic bot protection.
    // Note: Some strict CORS policies might reject custom headers, but we rely on the proxy to handle this.
    const headers = {
      'Accept': 'application/xml, text/xml, */*; q=0.01',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
    };

    const response = await fetch(targetUrl, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const buffer = await blob.slice(0, 2).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;

    let textContent = '';
    if (isGzip && 'DecompressionStream' in window) {
      const ds = new DecompressionStream('gzip');
      const decompressedStream = blob.stream().pipeThrough(ds);
      textContent = await new Response(decompressedStream).text();
    } else {
      textContent = await blob.text();
    }

    return extractUrlsFromContent(textContent);
  };

  try {
    return await performFetch(url);
  } catch (error) {
    console.warn(`Direct fetch failed for ${url}. Retrying with proxies...`);
    
    const proxyGenerators = [
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
    ];

    let lastError: any;
    for (const generator of proxyGenerators) {
      try {
        await delay(300);
        const proxyUrl = generator(url);
        return await performFetch(proxyUrl);
      } catch (e: any) {
        lastError = e;
      }
    }
    throw new Error(`Failed to fetch after multiple attempts. Last error: ${lastError?.message || 'Unknown'}`);
  }
};

/**
 * Recursively fetches sitemaps and structures the data by source.
 */
export const expandAndFetchSitemaps = async (initialUrls: string[], rootSourceName: string): Promise<SitemapData> => {
  const entries: SitemapEntry[] = [];
  const sitemaps: Record<string, number> = {};
  const visitedSitemaps = new Set<string>();
  
  // Initialize queue
  let sitemapQueue: string[] = [];

  // Categorize initial URLs
  initialUrls.forEach(url => {
    if (isSitemapUrl(url)) {
      if (!visitedSitemaps.has(url)) {
        sitemapQueue.push(url);
        visitedSitemaps.add(url);
        // We initialize the count for this sitemap to 0
        sitemaps[url] = 0; 
      }
    } else {
      entries.push({ url, source: rootSourceName });
      sitemaps[rootSourceName] = (sitemaps[rootSourceName] || 0) + 1;
    }
  });

  const CONCURRENCY_LIMIT = 2;

  while (sitemapQueue.length > 0) {
    const batch = sitemapQueue.splice(0, CONCURRENCY_LIMIT);
    
    if (visitedSitemaps.size > CONCURRENCY_LIMIT) {
       await delay(500); 
    }

    const results = await Promise.allSettled(batch.map(url => fetchSitemapFromUrl(url)));

    results.forEach((result, index) => {
      const currentSitemapUrl = batch[index];
      
      if (result.status === 'fulfilled') {
        const extractedUrls = result.value;
        let countInThisSitemap = 0;

        extractedUrls.forEach(u => {
           if (isSitemapUrl(u)) {
             if (!visitedSitemaps.has(u)) {
               visitedSitemaps.add(u);
               sitemapQueue.push(u);
               sitemaps[u] = 0;
             }
           } else {
             entries.push({ url: u, source: currentSitemapUrl });
             countInThisSitemap++;
           }
        });
        
        sitemaps[currentSitemapUrl] = countInThisSitemap;

      } else {
        console.error(`Failed to expand sub-sitemap: ${currentSitemapUrl}`, result.reason);
      }
    });
  }

  return { entries, sitemaps };
};

export const getExtension = (url: string): string => {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const parts = pathname.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      if (ext && ext.length < 5 && /^[a-z0-9]+$/i.test(ext)) {
        return '.' + ext.toLowerCase();
      }
    }
    return 'no-ext';
  } catch (e) {
    return 'invalid';
  }
};

export const getExtensionStats = (entries: SitemapEntry[]): Record<string, number> => {
  const stats: Record<string, number> = {};
  entries.forEach(entry => {
    const ext = getExtension(entry.url);
    stats[ext] = (stats[ext] || 0) + 1;
  });
  return stats;
};

/**
 * Converts entries to CSV string
 */
export const generateCSV = (entries: SitemapEntry[]): string => {
  const header = "URL,Source Sitemap\n";
  const rows = entries.map(e => {
    const safeUrl = e.url.replace(/"/g, '""');
    const safeSource = e.source.replace(/"/g, '""');
    return `"${safeUrl}","${safeSource}"`;
  }).join("\n");
  return header + rows;
};
