import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Copy, 
  Check, 
  Code, 
  Filter, 
  Calendar, 
  Globe, 
  Laptop, 
  Smartphone, 
  Search, 
  RotateCcw,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  UserCheck
} from 'lucide-react';
import { CustomEventSummary, Site, EventListItem, EventsFilterParams } from '../types/analytics';
import { fetchFilteredEvents } from '../lib/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';

interface EventsViewProps {
  events?: CustomEventSummary[];
  site: Site;
  onSelectVisitor?: (visitorId: string) => void;
  onSelectSession?: (sessionId: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ site, onSelectVisitor, onSelectSession }) => {
  const [eventList, setEventList] = useState<EventListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState<{
    eventNames: string[];
    categories: string[];
    browsers: string[];
    countries: string[];
    devices: string[];
  }>({
    eventNames: [],
    categories: [],
    browsers: [],
    countries: [],
    devices: [],
  });

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Server Components compliant filters state
  const [filters, setFilters] = useState<EventsFilterParams>({
    dateRange: 'all',
    eventName: '',
    category: '',
    browser: '',
    country: '',
    device: '',
    search: '',
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const loadEventsData = async () => {
    setLoading(true);
    try {
      const res = await fetchFilteredEvents(site.id, filters);
      setEventList(res.events);
      setTotalCount(res.total);
      setFilterOptions(res.options);
    } catch (e) {
      console.error('Error fetching filtered events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadEventsData();
  }, [site.id, filters]);

  const handleFilterChange = (key: keyof EventsFilterParams, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'all',
      eventName: '',
      category: '',
      browser: '',
      country: '',
      device: '',
      search: '',
    });
  };

  const totalPages = Math.ceil(eventList.length / pageSize) || 1;
  const paginatedEvents = eventList.slice((page - 1) * pageSize, page * pageSize);

  const snippet = `// Trigger custom events anywhere in your app:
window.analytics = window.analytics || [];
window.analytics.push(['track', 'signup_clicked', {
  category: 'Conversion',
  action: 'click_cta',
  label: 'Pricing Card Pro',
  value: 49
}]);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 text-xs font-mono font-medium">
            <Zap className="w-3.5 h-3.5" />
            <span>SERVER ACTION EVENT STREAM</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Events Stream & Analytics</span>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {totalCount} Total Triggers
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time custom events, UI clicks, form submits, scroll milestones, and conversion actions for <span className="text-zinc-200 font-mono">{site.domain}</span>.
          </p>
        </div>

        <button
          onClick={loadEventsData}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Events</span>
        </button>
      </div>

      {/* 6 Multi-Dimensional Server Components Filters Box */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">
              Filter Events (Server Components Parameters)
            </h3>
          </div>

          <button
            onClick={handleResetFilters}
            className="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* 6 Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          
          {/* 1. Tanggal (Date Range) */}
          <div className="space-y-1">
            <label className="text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Tanggal</span>
            </label>
            <select
              value={filters.dateRange || 'all'}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* 2. Event Name */}
          <div className="space-y-1">
            <label className="text-zinc-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Event Name</span>
            </label>
            <select
              value={filters.eventName || ''}
              onChange={(e) => handleFilterChange('eventName', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Events</option>
              {filterOptions.eventNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* 3. Category */}
          <div className="space-y-1">
            <label className="text-zinc-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Category</span>
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 4. Browser */}
          <div className="space-y-1">
            <label className="text-zinc-400 flex items-center gap-1">
              <Laptop className="w-3 h-3 text-sky-400" />
              <span>Browser</span>
            </label>
            <select
              value={filters.browser || ''}
              onChange={(e) => handleFilterChange('browser', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Browsers</option>
              {filterOptions.browsers.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 5. Country */}
          <div className="space-y-1">
            <label className="text-zinc-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-teal-400" />
              <span>Country</span>
            </label>
            <select
              value={filters.country || ''}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Countries</option>
              {filterOptions.countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 6. Device */}
          <div className="space-y-1">
            <label className="text-zinc-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-rose-400" />
              <span>Device</span>
            </label>
            <select
              value={filters.device || ''}
              onChange={(e) => handleFilterChange('device', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Devices</option>
              {filterOptions.devices.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Text Search Bar */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search action, label, page URL, or visitor ID..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main Events Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500 space-y-2">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Filtering events records...</p>
          </div>
        ) : eventList.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500">
            No events found matching current filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold">Event</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Label</th>
                  <th className="pb-3 font-semibold text-center">Value</th>
                  <th className="pb-3 font-semibold">Page</th>
                  <th className="pb-3 font-semibold">Visitor</th>
                  <th className="pb-3 font-semibold text-right">Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-zinc-800/50 transition-colors">
                    
                    {/* Time */}
                    <td className="py-3 pr-2 text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(evt.time).toLocaleTimeString()}
                    </td>

                    {/* Event */}
                    <td className="py-3 px-2 font-bold text-amber-400 whitespace-nowrap flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{evt.event}</span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-2 text-purple-400 font-semibold whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60">
                        {evt.category}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-sky-300 font-mono">
                      {evt.action}
                    </td>

                    {/* Label */}
                    <td className="py-3 px-2 text-zinc-300 max-w-[140px] truncate" title={evt.label}>
                      {evt.label}
                    </td>

                    {/* Value */}
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">
                      {evt.value}
                    </td>

                    {/* Page */}
                    <td className="py-3 px-2 text-zinc-200 max-w-[150px] truncate" title={evt.page}>
                      {evt.page}
                    </td>

                    {/* Visitor */}
                    <td className="py-3 px-2 text-sky-400">
                      {onSelectVisitor ? (
                        <button
                          onClick={() => evt.visitorId && onSelectVisitor(evt.visitorId)}
                          className="hover:underline font-bold text-sky-400"
                        >
                          {evt.visitorId || '-'}
                        </button>
                      ) : (
                        evt.visitorId || '-'
                      )}
                    </td>

                    {/* Session */}
                    <td className="py-3 pl-2 text-right">
                      {evt.sessionId ? (
                        onSelectSession ? (
                          <button
                            onClick={() => onSelectSession(evt.sessionId)}
                            className="inline-flex items-center space-x-1 text-emerald-400 hover:underline font-bold"
                          >
                            <span>#{evt.sessionId.slice(0, 6)}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ) : (
                          `#${evt.sessionId.slice(0, 6)}`
                        )
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
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
            Showing <span className="text-white font-bold">{paginatedEvents.length}</span> of <span className="text-white font-bold">{totalCount}</span> events
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-950 text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-amber-400 font-bold">
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

      {/* Snippet Card */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-200 font-mono">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>How to dispatch custom events to Pulse Analytics</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors font-mono"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-purple-300 overflow-x-auto leading-relaxed">
          {snippet}
        </pre>
      </div>

    </div>
  );
};

