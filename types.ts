
export interface SitemapEntry {
  url: string;
  source: string; // The URL of the sitemap file this URL was found in
}

export interface SitemapData {
  entries: SitemapEntry[];
  sitemaps: Record<string, number>; // Map of sitemap URL -> count of URLs found inside
}

export interface SitemapStats {
  totalUrls: number;
  filteredUrls: number;
  extensions: Record<string, number>;
  topSegments: Record<string, number>;
}

export interface FilterState {
  search: string;
  extension: string;
  pathSegment: string; // e.g., '/en/', '/products/'
  sourceSitemap: string; // specific sitemap file to filter by
  excludePattern: string; // New field for negative filtering (comma separated)
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeminiInsight {
  category: string;
  structure: string;
  seoAdvice: string;
}
