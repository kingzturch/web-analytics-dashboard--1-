import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Eye, 
  UserCheck, 
  Clock, 
  LogOut, 
  TrendingUp, 
  Activity, 
  Search, 
  RefreshCw, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers
} from 'lucide-react';
import { PageAnalyticsItem, Site } from '../types/analytics';
import { fetchPageAnalytics } from '../lib/analytics';

interface PagesViewProps {
  site: Site;
  onSelectPageUrl: (url: string) => void;
}

export const PagesView: React.FC<PagesViewProps> = ({ site, onSelectPageUrl }) => {
  const [pages, setPages] = useState<PageAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await fetchPageAnalytics(site.id);
      setPages(data);
    } catch (e) {
      console.error('Error fetching page analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, [site.id]);

  const filteredPages = pages.filter(p => {
    const q = search.toLowerCase();
    return (p.url || '').toLowerCase().includes(q) || 
           (p.title || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredPages.length / pageSize) || 1;
  const paginatedPages = filteredPages.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono font-medium">
            <FileText className="w-3.5 h-3.5" />
            <span>PAGE LEVEL ANALYTICS ENGINE</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Page Analytics</span>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {pages.length} Tracked URLs
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Performance metrics per URL including total views, unique visitors, engagement duration, scroll depth, exit rate, and bounce rate for <span className="text-zinc-200 font-mono">{site.domain}</span>.
          </p>
        </div>

        <button
          onClick={loadPages}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Pages</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search URL or Page Title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
          <span>Showing </span>
          <span className="text-emerald-400 font-bold">{paginatedPages.length}</span>
          <span> of </span>
          <span className="text-zinc-200 font-bold">{filteredPages.length} pages</span>
        </div>
      </div>

      {/* Main Page Analytics Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Processing Page Level Metrics...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500">
            No pages found matching search query "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-3 font-semibold">URL</th>
                  <th className="pb-3 font-semibold text-center">Views</th>
                  <th className="pb-3 font-semibold text-center">Unique Views</th>
                  <th className="pb-3 font-semibold text-center">Average Duration</th>
                  <th className="pb-3 font-semibold text-center">Exit Rate</th>
                  <th className="pb-3 font-semibold text-center">Average Scroll</th>
                  <th className="pb-3 font-semibold text-center">Bounce Rate</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedPages.map((item) => (
                  <tr 
                    key={item.url}
                    onClick={() => onSelectPageUrl(item.url)}
                    className="hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                  >
                    {/* URL */}
                    <td className="py-3 pr-4 font-bold text-emerald-400 max-w-[240px] truncate group-hover:underline">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                        <span className="truncate">{item.url}</span>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-2 text-center">
                      <span className="px-2.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-bold text-emerald-400">
                        {item.views.toLocaleString()}
                      </span>
                    </td>

                    {/* Unique Views */}
                    <td className="py-3 px-2 text-center">
                      <span className="px-2.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-bold text-sky-400">
                        {item.uniqueViews.toLocaleString()}
                      </span>
                    </td>

                    {/* Average Duration */}
                    <td className="py-3 px-2 text-center text-amber-400 font-bold">
                      {item.avgDurationFormatted}
                    </td>

                    {/* Exit Rate */}
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">
                      {item.exitRate}%
                    </td>

                    {/* Average Scroll */}
                    <td className="py-3 px-2 text-center text-purple-400 font-bold">
                      <div className="inline-flex items-center space-x-1.5">
                        <span>{item.avgScroll}%</span>
                        <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-purple-500" style={{ width: `${item.avgScroll}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Bounce Rate */}
                    <td className="py-3 px-2 text-center text-teal-400 font-bold">
                      {item.bounceRate}%
                    </td>

                    {/* Action */}
                    <td className="py-3 pl-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPageUrl(item.url);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] group-hover:bg-emerald-500 group-hover:text-white transition-colors"
                      >
                        <span>Detail Page</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div>
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-950 text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 font-bold">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-950 text-zinc-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
