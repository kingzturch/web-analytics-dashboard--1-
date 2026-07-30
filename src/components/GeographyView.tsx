import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  RefreshCw, 
  Users, 
  Activity, 
  Eye, 
  Clock, 
  LogOut, 
  ArrowUpRight, 
  Search, 
  X, 
  FileText, 
  TrendingUp, 
  MapPin, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CountryAnalyticsItem, Site, GlobalFilterState } from '../types/analytics';
import { fetchGeographyData } from '../lib/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';

interface GeographyViewProps {
  site: Site;
  globalFilter?: GlobalFilterState;
  onSelectCountryFilter?: (countryCode: string) => void;
}

// World Map Pins coordinates for key country locations on an SVG canvas (800x400)
const COUNTRY_MAP_PIN_COORDS: Record<string, { x: number; y: number; code: string; label: string }> = {
  'ID': { x: 620, y: 240, code: 'ID', label: 'Indonesia' },
  'US': { x: 210, y: 150, code: 'US', label: 'United States' },
  'SG': { x: 610, y: 230, code: 'SG', label: 'Singapore' },
  'JP': { x: 690, y: 160, code: 'JP', label: 'Japan' },
  'DE': { x: 440, y: 125, code: 'DE', label: 'Germany' },
  'GB': { x: 405, y: 120, code: 'GB', label: 'United Kingdom' },
  'AU': { x: 680, y: 290, code: 'AU', label: 'Australia' },
  'IN': { x: 550, y: 200, code: 'IN', label: 'India' },
  'CA': { x: 210, y: 100, code: 'CA', label: 'Canada' },
  'FR': { x: 415, y: 135, code: 'FR', label: 'France' },
  'BR': { x: 300, y: 260, code: 'BR', label: 'Brazil' },
  'ZA': { x: 450, y: 300, code: 'ZA', label: 'South Africa' },
};

export const GeographyView: React.FC<GeographyViewProps> = ({ site, globalFilter, onSelectCountryFilter }) => {
  const [countries, setCountries] = useState<CountryAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryAnalyticsItem | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<CountryAnalyticsItem | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const loadGeography = async () => {
    setLoading(true);
    try {
      const data = await fetchGeographyData(site.id, globalFilter);
      setCountries(data);
      if (data.length > 0 && !selectedCountry) {
        setSelectedCountry(data[0]);
      }
    } catch (e) {
      console.error('Error fetching geography analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeography();
  }, [site.id, globalFilter]);

  const filteredCountries = countries.filter(c => {
    const q = search.toLowerCase();
    return (c.country || '').toLowerCase().includes(q) || 
           (c.code || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredCountries.length / pageSize) || 1;
  const paginatedCountries = filteredCountries.slice((page - 1) * pageSize, page * pageSize);

  const maxVisitors = countries.length > 0 ? Math.max(...countries.map(c => c.visitors)) : 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono font-medium">
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL GEOGRAPHY ANALYTICS ENGINE</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Geographic Distribution</span>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {countries.length} Regions
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Interactive world map, country-level sessions, bounce rates, durations, and top pages for <span className="text-zinc-200 font-mono">{site.domain}</span>.
          </p>
        </div>

        <button
          onClick={loadGeography}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Map</span>
        </button>
      </div>

      {/* Interactive World Map Canvas */}
      <div className="p-6 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-md relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 font-mono">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Interactive World Traffic Map
            </h3>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
            <span>Click any node on the map or list to inspect country metrics</span>
          </div>
        </div>

        {/* Map SVG Canvas */}
        <div className="relative w-full aspect-[2/1] min-h-[260px] bg-zinc-950/80 border border-zinc-800/80 rounded-xl overflow-hidden flex items-center justify-center p-4">
          
          {/* Decorative World Vector Grid Base */}
          <svg className="w-full h-full opacity-30 absolute inset-0 pointer-events-none" viewBox="0 0 800 400" fill="none">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#3f3f46" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="800" height="400" fill="url(#grid)" />
            {/* World Continents Rough Outlines */}
            <path d="M 120 100 Q 180 80 260 110 T 320 220 T 180 320 Z" fill="#27272a" />
            <path d="M 380 90 Q 480 70 520 120 T 460 220 T 420 340 Z" fill="#27272a" />
            <path d="M 520 90 Q 700 70 760 140 T 680 250 T 560 240 Z" fill="#27272a" />
            <path d="M 620 250 Q 720 260 740 320 Z" fill="#27272a" />
          </svg>

          {/* Interactive Country Pins */}
          <svg className="w-full h-full relative z-10" viewBox="0 0 800 400">
            {countries.map((item) => {
              const coords = COUNTRY_MAP_PIN_COORDS[item.code] || { x: 400, y: 200, code: item.code, label: item.country };
              const ratio = item.visitors / maxVisitors;
              const radius = Math.max(6, Math.min(24, Math.round(ratio * 24)));
              const isSelected = selectedCountry?.code === item.code;
              const isHovered = hoveredCountry?.code === item.code;

              return (
                <g 
                  key={item.code} 
                  className="cursor-pointer transition-transform group"
                  onClick={() => {
                    setSelectedCountry(item);
                    if (onSelectCountryFilter) onSelectCountryFilter(item.code);
                  }}
                  onMouseEnter={() => setHoveredCountry(item)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  {/* Outer Pulsing Aura */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius + 8}
                    fill={isSelected ? '#10b981' : '#0ea5e9'}
                    opacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.12}
                    className={isSelected ? 'animate-ping' : ''}
                  />

                  {/* Node Circle */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius}
                    fill={isSelected ? '#10b981' : isHovered ? '#38bdf8' : '#0284c7'}
                    stroke={isSelected ? '#ffffff' : '#18181b'}
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {/* Country Flag / Label */}
                  <text
                    x={coords.x}
                    y={coords.y + radius + 14}
                    textAnchor="middle"
                    fill={isSelected ? '#34d399' : '#d4d4d8'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {getCountryFlag(item.code)} {item.code} ({item.visitors.toLocaleString()})
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredCountry && (
            <div className="absolute top-4 left-4 z-20 p-3 rounded-xl bg-zinc-900/95 border border-emerald-500/40 text-xs font-mono shadow-2xl space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <span>{getCountryFlag(hoveredCountry.code)}</span>
                <span>{hoveredCountry.country} ({hoveredCountry.code})</span>
              </div>
              <div className="text-zinc-300">
                Visitors: <span className="text-white font-bold">{hoveredCountry.visitors.toLocaleString()}</span>
              </div>
              <div className="text-zinc-300">
                Bounce Rate: <span className="text-rose-400 font-bold">{hoveredCountry.bounceRate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Country Detailed Analytics Panel */}
      {selectedCountry && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-emerald-500/30 shadow-xl space-y-5 animate-fade-in relative">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getCountryFlag(selectedCountry.code)}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedCountry.country}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono text-xs font-bold">
                    {selectedCountry.code}
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400">
                  Regional Performance Deep-Dive & Top Content
                </p>
              </div>
            </div>

            {onSelectCountryFilter && (
              <button
                onClick={() => onSelectCountryFilter(selectedCountry.code)}
                className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-mono text-xs font-bold hover:bg-emerald-400 transition-colors"
              >
                <span>Filter Dashboard by {selectedCountry.country}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 5 Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
            {/* 1. Visitors */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Visitors</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {selectedCountry.visitors.toLocaleString()}
              </div>
            </div>

            {/* 2. Sessions */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Sessions</span>
                <Activity className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {selectedCountry.sessions.toLocaleString()}
              </div>
            </div>

            {/* 3. Page Views */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Page Views</span>
                <Eye className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {selectedCountry.pageViews.toLocaleString()}
              </div>
            </div>

            {/* 4. Bounce Rate */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Bounce Rate</span>
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-lg font-bold text-rose-400">
                {selectedCountry.bounceRate}%
              </div>
            </div>

            {/* 5. Average Duration */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Avg Duration</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-amber-400">
                {selectedCountry.avgDurationFormatted}
              </div>
            </div>
          </div>

          {/* Top Pages from this Country */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Viewed Content Pages in {selectedCountry.country}</span>
            </h4>

            <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden font-mono text-xs">
              {selectedCountry.topPages.map((page, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between hover:bg-zinc-800/40 transition-colors">
                  <div className="space-y-0.5 truncate max-w-[70%]">
                    <div className="text-zinc-200 font-bold truncate">{page.title}</div>
                    <div className="text-[11px] text-emerald-400 truncate">{page.url}</div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-white font-bold">
                      {page.views.toLocaleString()} views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Country List Table */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-sm space-y-4">
        
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search country name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="text-xs font-mono text-zinc-400">
            Showing <span className="text-emerald-400 font-bold">{paginatedCountries.length}</span> of <span className="text-zinc-200 font-bold">{filteredCountries.length} countries</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="pb-3 font-semibold">Country</th>
                <th className="pb-3 font-semibold text-center">Visitors</th>
                <th className="pb-3 font-semibold text-center">Sessions</th>
                <th className="pb-3 font-semibold text-center">Page Views</th>
                <th className="pb-3 font-semibold text-center">Bounce Rate</th>
                <th className="pb-3 font-semibold text-center">Avg Duration</th>
                <th className="pb-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedCountries.map((item) => {
                const isSelected = selectedCountry?.code === item.code;
                return (
                  <tr 
                    key={item.code} 
                    onClick={() => setSelectedCountry(item)}
                    className={`hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-zinc-800/80 border-l-2 border-emerald-400' : ''
                    }`}
                  >
                    {/* Country */}
                    <td className="py-3 pr-4 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCountryFlag(item.code)}</span>
                        <span>{item.country}</span>
                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                          {item.code}
                        </span>
                      </div>
                    </td>

                    {/* Visitors */}
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">
                      {item.visitors.toLocaleString()}
                    </td>

                    {/* Sessions */}
                    <td className="py-3 px-2 text-center text-sky-400 font-bold">
                      {item.sessions.toLocaleString()}
                    </td>

                    {/* Page Views */}
                    <td className="py-3 px-2 text-center text-purple-400 font-bold">
                      {item.pageViews.toLocaleString()}
                    </td>

                    {/* Bounce Rate */}
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">
                      {item.bounceRate}%
                    </td>

                    {/* Avg Duration */}
                    <td className="py-3 px-2 text-center text-amber-400 font-bold">
                      {item.avgDurationFormatted}
                    </td>

                    {/* Action */}
                    <td className="py-3 pl-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountry(item);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 text-[11px] hover:bg-emerald-500 hover:text-white transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div>
            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 font-bold">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
