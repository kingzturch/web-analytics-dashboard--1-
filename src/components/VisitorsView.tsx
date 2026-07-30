import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Laptop, 
  Smartphone, 
  Clock, 
  Eye, 
  Layers, 
  ArrowUpRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import { VisitorListItem, Site } from '../types/analytics';
import { fetchVisitors } from '../lib/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';

interface VisitorsViewProps {
  site: Site;
  onSelectVisitor: (visitorId: string) => void;
}

export const VisitorsView: React.FC<VisitorsViewProps> = ({ site, onSelectVisitor }) => {
  const [visitors, setVisitors] = useState<VisitorListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await fetchVisitors(site.id, p, pageSize, q);
      setVisitors(res.visitors);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotalVisitors(res.total);
    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData(1, search);
  }, [site.id]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    loadData(1, val);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      loadData(newPage, search);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-400 text-xs font-mono font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>SERVER ACTIONS PAGINATED DATA</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Visitors Directory</span>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {totalVisitors} Unique Profiles
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Browse all individual visitor sessions, country breakdown, devices, and full session activity for <span className="text-zinc-200 font-mono">{site.domain}</span>.
          </p>
        </div>

        <button
          onClick={() => loadData(page, search)}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visitor ID, country, browser, or device..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
          <span>Showing page </span>
          <span className="text-emerald-400 font-bold">{page}</span>
          <span> of </span>
          <span className="text-zinc-200 font-bold">{totalPages}</span>
        </div>
      </div>

      {/* Main Visitors Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500 space-y-2">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading visitors table via Server Actions...</p>
          </div>
        ) : visitors.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500">
            No visitor profiles found matching query "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-3 font-semibold">Visitor ID</th>
                  <th className="pb-3 font-semibold">First Seen</th>
                  <th className="pb-3 font-semibold">Last Seen</th>
                  <th className="pb-3 font-semibold text-center">Total Sessions</th>
                  <th className="pb-3 font-semibold text-center">Total Page Views</th>
                  <th className="pb-3 font-semibold">Country</th>
                  <th className="pb-3 font-semibold">Device</th>
                  <th className="pb-3 font-semibold">Browser</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {visitors.map((v) => (
                  <tr 
                    key={v.id}
                    onClick={() => onSelectVisitor(v.id)}
                    className="hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                  >
                    {/* Visitor ID */}
                    <td className="py-3 pr-3 text-sky-400 font-bold group-hover:underline flex items-center space-x-1.5">
                      <span>{v.id}</span>
                    </td>

                    {/* First Seen */}
                    <td className="py-3 px-2 text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(v.firstSeen).toLocaleDateString()} {new Date(v.firstSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Last Seen */}
                    <td className="py-3 px-2 text-zinc-300 text-[11px] whitespace-nowrap">
                      {new Date(v.lastSeen).toLocaleDateString()} {new Date(v.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Total Sessions */}
                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-bold text-amber-400">
                        {v.totalSessions}
                      </span>
                    </td>

                    {/* Total Page Views */}
                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-bold text-emerald-400">
                        {v.totalPageViews}
                      </span>
                    </td>

                    {/* Country */}
                    <td className="py-3 px-2 text-zinc-200">
                      <div className="flex items-center space-x-1.5 font-sans text-xs">
                        <span className="text-sm">{getCountryFlag(v.countryCode)}</span>
                        <span>{v.country}</span>
                      </div>
                    </td>

                    {/* Device */}
                    <td className="py-3 px-2 text-zinc-300 capitalize">
                      <div className="flex items-center space-x-1">
                        {v.device === 'desktop' ? <Laptop className="w-3.5 h-3.5 text-zinc-400" /> : <Smartphone className="w-3.5 h-3.5 text-zinc-400" />}
                        <span>{v.device}</span>
                      </div>
                    </td>

                    {/* Browser */}
                    <td className="py-3 px-2 text-zinc-300">
                      {v.browser}
                    </td>

                    {/* Action */}
                    <td className="py-3 pl-2 text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <span>Detail</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
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
            Showing <span className="text-white font-bold">{visitors.length}</span> of <span className="text-white font-bold">{totalVisitors}</span> visitors
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="pagination-prev-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-950 text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 font-bold">
              {page} / {totalPages}
            </span>

            <button
              id="pagination-next-btn"
              onClick={() => handlePageChange(page + 1)}
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
