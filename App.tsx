
import React, { useState, useMemo, useEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { StatsCard } from './components/StatsCard';
import { parseSitemapFile, fetchSitemapFromUrl, getExtensionStats, expandAndFetchSitemaps, generateCSV } from './services/sitemapService';
import { analyzeUrlsWithGemini } from './services/geminiService';
import { FilterState, AnalysisStatus, GeminiInsight, SitemapEntry } from './types';

const Icons = {
  Link: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>,
  Filter: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>,
  Code: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 18" /></svg>,
  Sparkles: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>,
  Globe: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 2.176 11.957 11.957 0 0 1 4.157 7.582m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  Download: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  Map: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>
};

const ITEMS_PER_PAGE = 100;

export default function App() {
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [sitemaps, setSitemaps] = useState<Record<string, number>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState('');
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    extension: '',
    pathSegment: '',
    sourceSitemap: '',
    excludePattern: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [aiStatus, setAiStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [aiInsight, setAiInsight] = useState<GeminiInsight | null>(null);

  const extensionStats = useMemo(() => {
    return entries.length > 0 ? getExtensionStats(entries) : {};
  }, [entries]);

  const uniqueExtensions = useMemo(() => Object.keys(extensionStats), [extensionStats]);

  const filteredEntries = useMemo(() => {
    // Parse exclusion patterns: split by comma OR newline, trim whitespace, and ignore empty strings
    const excludes = filters.excludePattern
      .split(/[\n,]/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    return entries.filter(entry => {
      const urlLower = entry.url.toLowerCase();

      // Negative check: If URL contains ANY of the exclude patterns, filter it out
      if (excludes.length > 0) {
        const matchesExclude = excludes.some(exclude => urlLower.includes(exclude));
        if (matchesExclude) return false;
      }

      const matchSearch = filters.search ? urlLower.includes(filters.search.toLowerCase()) : true;
      const matchSegment = filters.pathSegment ? entry.url.includes(filters.pathSegment) : true;
      const matchExt = filters.extension ? urlLower.endsWith(filters.extension.toLowerCase()) : true;
      const matchSource = filters.sourceSitemap ? entry.source === filters.sourceSitemap : true;
      
      return matchSearch && matchSegment && matchExt && matchSource;
    });
  }, [entries, filters]);

  useEffect(() => {
    setCurrentPage(1);
    if (aiStatus === AnalysisStatus.SUCCESS) {
      setAiStatus(AnalysisStatus.IDLE);
      setAiInsight(null);
    }
  }, [filters, entries]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);

  const resetState = () => {
    setEntries([]);
    setSitemaps({});
    setFilters({ search: '', extension: '', pathSegment: '', sourceSitemap: '', excludePattern: '' });
    setAiStatus(AnalysisStatus.IDLE);
    setAiInsight(null);
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    resetState();

    try {
      setTimeout(async () => {
        const initialUrls = await parseSitemapFile(file);
        const data = await expandAndFetchSitemaps(initialUrls, file.name);
        setEntries(data.entries);
        setSitemaps(data.sitemaps);
        setIsProcessing(false);
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Failed to parse file. Ensure it is a valid XML or GZIP file.");
      setIsProcessing(false);
    }
  };

  const handleUrlFetch = async () => {
    if (!sitemapUrl) return;
    setIsProcessing(true);
    setFileName(sitemapUrl);
    resetState();

    try {
      const initialUrls = await fetchSitemapFromUrl(sitemapUrl);
      const data = await expandAndFetchSitemaps(initialUrls, sitemapUrl);
      setEntries(data.entries);
      setSitemaps(data.sitemaps);
      setIsProcessing(false);
    } catch (error: any) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      alert(`${msg}`);
      setIsProcessing(false);
    }
  };

  const handleAnalyzeWithGemini = async () => {
    if (filteredEntries.length === 0) return;
    setAiStatus(AnalysisStatus.LOADING);
    try {
      const urlsOnly = filteredEntries.map(e => e.url);
      const insight = await analyzeUrlsWithGemini(urlsOnly);
      setAiInsight(insight);
      setAiStatus(AnalysisStatus.SUCCESS);
    } catch (e) {
      setAiStatus(AnalysisStatus.ERROR);
    }
  };

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
    const csvContent = generateCSV(filteredEntries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sitemap_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    resetState();
    setFileName(null);
    setSitemapUrl('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-[#0f172a]/95 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Sitemap <span className="text-brand-400">X-Ray</span></h1>
          </div>
          {entries.length > 0 && (
             <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700 max-w-xs truncate" title={fileName || ''}>
                  File: <span className="text-gray-200">{fileName}</span>
                </div>
                <button 
                  onClick={reset}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  New Analysis
                </button>
             </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {entries.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-12 space-y-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
               <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400">
                    {Icons.Globe}
                 </div>
                 <h3 className="text-lg font-semibold text-white">Fetch via URL</h3>
               </div>
               <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://example.com/sitemap.xml" 
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
                  />
                  <button 
                    onClick={handleUrlFetch}
                    disabled={isProcessing || !sitemapUrl}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? 'Fetching...' : 'Fetch'}
                  </button>
               </div>
               <p className="text-xs text-gray-500 mt-2">
                 We try to simulate a browser user agent. If sitemaps are nested (sitemap index), we fetch all of them automatically.
               </p>
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0f172a] px-3 text-sm text-gray-500 font-medium uppercase tracking-wider">Or upload file</span>
                </div>
            </div>
            <Dropzone onFileSelect={handleFileUpload} isLoading={isProcessing} />
            {isProcessing && (
              <div className="mt-8 text-center space-y-2">
                 <div className="w-16 h-16 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto"></div>
                 <p className="text-gray-400 animate-pulse">Processing sitemap data...</p>
                 <p className="text-xs text-gray-500">Crawling through sitemap index structures...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                label="Total URLs" 
                value={entries.length.toLocaleString()} 
                icon={Icons.Link} 
                color="brand"
              />
               <StatsCard 
                label="Filtered Results" 
                value={filteredEntries.length.toLocaleString()} 
                icon={Icons.Filter} 
                color="emerald"
              />
               <StatsCard 
                label="Sub-Sitemaps" 
                value={Object.keys(sitemaps).length} 
                icon={Icons.Map} 
                color="purple"
              />
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-1 flex flex-col justify-center">
                 <button
                    onClick={handleAnalyzeWithGemini}
                    disabled={aiStatus === AnalysisStatus.LOADING}
                    className="w-full h-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 transition-all group disabled:opacity-50"
                 >
                    <div className="text-left">
                       <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">AI Audit</p>
                       <p className="text-white font-semibold flex items-center gap-2">
                          {aiStatus === AnalysisStatus.LOADING ? 'Analyzing...' : 'Analyze Filtered'}
                       </p>
                    </div>
                    <div className={`p-2 rounded-full bg-indigo-500/20 text-indigo-300 group-hover:scale-110 transition-transform ${aiStatus === AnalysisStatus.LOADING ? 'animate-pulse' : ''}`}>
                       {Icons.Sparkles}
                    </div>
                 </button>
              </div>
            </div>

            {aiStatus === AnalysisStatus.SUCCESS && aiInsight && (
               <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 relative overflow-hidden animate-fade-in-up">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-indigo-400">{Icons.Sparkles}</span> Gemini Analysis
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 relative z-10">
                     <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Category</p>
                        <p className="text-indigo-100 font-medium bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg">{aiInsight.category}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Structure Pattern</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{aiInsight.structure}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">SEO Advice</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{aiInsight.seoAdvice}</p>
                     </div>
                  </div>
               </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Export Button */}
                <button 
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20"
                >
                  {Icons.Download}
                  Export filtered to CSV
                </button>

                {/* Filters */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Filters</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Path Segment</label>
                    <input 
                      type="text" 
                      placeholder="e.g. /en/ or /products/" 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      value={filters.pathSegment}
                      onChange={(e) => setFilters(prev => ({...prev, pathSegment: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Extension</label>
                    <select 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      value={filters.extension}
                      onChange={(e) => setFilters(prev => ({...prev, extension: e.target.value}))}
                    >
                      <option value="">All Extensions</option>
                      {uniqueExtensions.map(ext => (
                        <option key={ext} value={ext}>{ext} ({extensionStats[ext]})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Search URL</label>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Exclude Patterns</label>
                    <textarea 
                      placeholder="e.g. product-eng, /archive/ (comma separated)" 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-y min-h-[80px]"
                      value={filters.excludePattern}
                      onChange={(e) => setFilters(prev => ({...prev, excludePattern: e.target.value}))}
                    />
                    <p className="text-[10px] text-gray-500">Supports comma or newline separation</p>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-700">
                    <button 
                      onClick={() => setFilters({search: '', extension: '', pathSegment: '', sourceSitemap: '', excludePattern: ''})}
                      className="w-full py-2 text-xs font-medium text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Sitemap Sources List */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                   <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Sitemap Structure</h3>
                   <div className="space-y-1 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, sourceSitemap: '' }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between ${!filters.sourceSitemap ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:bg-gray-700'}`}
                      >
                         <span className="truncate">All Sources</span>
                         <span className="text-xs opacity-70 bg-gray-900 px-1.5 py-0.5 rounded">{entries.length}</span>
                      </button>
                      {Object.entries(sitemaps).map(([url, count]) => (
                        <button
                          key={url}
                          onClick={() => setFilters(prev => ({ ...prev, sourceSitemap: url }))}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center group ${filters.sourceSitemap === url ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:bg-gray-700'}`}
                          title={url}
                        >
                           <span className="truncate flex-1 mr-2">{url.split('/').pop()}</span>
                           <span className="text-xs opacity-70 bg-gray-900 px-1.5 py-0.5 rounded group-hover:text-white">{count}</span>
                        </button>
                      ))}
                   </div>
                </div>

              </div>

              {/* URL Table */}
              <div className="lg:col-span-3">
                 <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-850">
                      <h2 className="font-semibold text-white">
                         {filters.sourceSitemap ? `URLs in: ${filters.sourceSitemap.split('/').pop()}` : 'All URLs'}
                      </h2>
                      <span className="text-xs text-gray-500 font-mono">
                        Page {currentPage} of {Math.max(1, totalPages)}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-900/50 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-3 font-medium w-16">#</th>
                            <th className="px-6 py-3 font-medium">Location</th>
                            {!filters.sourceSitemap && <th className="px-6 py-3 font-medium w-1/4">Source</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50 text-sm">
                          {paginatedEntries.length > 0 ? (
                            paginatedEntries.map((entry, index) => {
                                const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                return (
                                  <tr key={globalIndex} className="hover:bg-gray-700/30 transition-colors group">
                                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{globalIndex}</td>
                                    <td className="px-6 py-3 text-gray-300 break-all font-mono text-xs md:text-sm group-hover:text-white">
                                      {entry.url}
                                    </td>
                                    {!filters.sourceSitemap && (
                                      <td className="px-6 py-3 text-gray-500 text-xs truncate max-w-xs" title={entry.source}>
                                        {entry.source.split('/').pop()}
                                      </td>
                                    )}
                                  </tr>
                                )
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                No URLs found matching your filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-700 bg-gray-850 flex items-center justify-between">
                         <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                         >
                           Previous
                         </button>
                         <div className="text-sm text-gray-400">
                            Showing <span className="text-white font-medium">{paginatedEntries.length}</span> of <span className="text-white font-medium">{filteredEntries.length.toLocaleString()}</span>
                         </div>
                         <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                         >
                           Next
                         </button>
                      </div>
                    )}
                 </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
