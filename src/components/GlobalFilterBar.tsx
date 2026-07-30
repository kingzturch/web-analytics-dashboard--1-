import React, { useState } from 'react';
import { 
  Filter, 
  Calendar, 
  Globe, 
  Laptop, 
  Layers, 
  Smartphone, 
  Tag, 
  Share2, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Sparkles,
  Link2
} from 'lucide-react';
import { Site, GlobalFilterState } from '../types/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';

interface GlobalFilterBarProps {
  sites: Site[];
  selectedSite: Site;
  onSelectSite: (site: Site) => void;
  filters: GlobalFilterState;
  onChangeFilter: (key: keyof GlobalFilterState, value: string) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  filters,
  onChangeFilter,
  onResetFilters,
  activeFilterCount,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyShareableUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePresetDate = (preset: 'today' | '7d' | '30d' | '90d' | 'all') => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (preset === 'today') {
      onChangeFilter('from', todayStr);
      onChangeFilter('to', todayStr);
    } else if (preset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      onChangeFilter('from', d.toISOString().split('T')[0]);
      onChangeFilter('to', todayStr);
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      onChangeFilter('from', d.toISOString().split('T')[0]);
      onChangeFilter('to', todayStr);
    } else if (preset === '90d') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      onChangeFilter('from', d.toISOString().split('T')[0]);
      onChangeFilter('to', todayStr);
    } else {
      onChangeFilter('from', '');
      onChangeFilter('to', '');
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-xl overflow-hidden transition-all">
      {/* Top Filter Bar Summary Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-zinc-900">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight font-mono uppercase">Global Analytics Filters</h3>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  {activeFilterCount} Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              All dashboard widgets, charts, and tables synchronize automatically with these URL parameter parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Share URL Button */}
          <button
            onClick={handleCopyShareableUrl}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors border border-zinc-700"
            title="Copy URL with current filter state search params"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedUrl ? 'Copied URL!' : 'Share URL'}</span>
          </button>

          {/* Reset Filters Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-300 text-xs font-mono transition-colors border border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset</span>
            </button>
          )}

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Controls Grid */}
      {expanded && (
        <div className="p-4 sm:p-5 pt-0 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          
          {/* 1. Website Site Selector */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Website</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?site=</span>
            </label>
            <select
              value={selectedSite.id}
              onChange={(e) => {
                const found = sites.find(s => s.id === e.target.value);
                if (found) onSelectSite(found);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-bold focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.domain})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Date Range (From & To) */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Date Range</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?from=&to=</span>
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={filters.from || ''}
                onChange={(e) => onChangeFilter('from', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="date"
                value={filters.to || ''}
                onChange={(e) => onChangeFilter('to', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 pt-0.5 text-[10px]">
              <button onClick={() => handlePresetDate('7d')} className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300">7D</button>
              <button onClick={() => handlePresetDate('30d')} className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300">30D</button>
              <button onClick={() => handlePresetDate('90d')} className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300">90D</button>
              <button onClick={() => handlePresetDate('all')} className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300">All</button>
            </div>
          </div>

          {/* 3. Country Filter */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Country</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?country=</span>
            </label>
            <select
              value={filters.country || ''}
              onChange={(e) => onChangeFilter('country', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All Countries</option>
              <option value="ID">{getCountryFlag('ID')} Indonesia (ID)</option>
              <option value="US">{getCountryFlag('US')} United States (US)</option>
              <option value="SG">{getCountryFlag('SG')} Singapore (SG)</option>
              <option value="JP">{getCountryFlag('JP')} Japan (JP)</option>
              <option value="DE">{getCountryFlag('DE')} Germany (DE)</option>
              <option value="GB">{getCountryFlag('GB')} United Kingdom (GB)</option>
              <option value="AU">{getCountryFlag('AU')} Australia (AU)</option>
              <option value="IN">{getCountryFlag('IN')} India (IN)</option>
            </select>
          </div>

          {/* 4. Browser Filter */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Laptop className="w-3.5 h-3.5 text-purple-400" />
                <span>Browser</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?browser=</span>
            </label>
            <select
              value={filters.browser || ''}
              onChange={(e) => onChangeFilter('browser', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All Browsers</option>
              <option value="Chrome">Chrome</option>
              <option value="Safari">Safari</option>
              <option value="Firefox">Firefox</option>
              <option value="Edge">Edge</option>
              <option value="Brave">Brave</option>
            </select>
          </div>

          {/* 5. OS Filter */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Operating System</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?os=</span>
            </label>
            <select
              value={filters.os || ''}
              onChange={(e) => onChangeFilter('os', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All OS</option>
              <option value="macOS">macOS</option>
              <option value="Windows">Windows</option>
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
              <option value="Linux">Linux</option>
            </select>
          </div>

          {/* 6. Device Filter */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                <span>Device Type</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?device=</span>
            </label>
            <select
              value={filters.device || ''}
              onChange={(e) => onChangeFilter('device', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          {/* 7. Referrer Filter */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Referrer</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?referrer=</span>
            </label>
            <input
              type="text"
              placeholder="e.g. google, github, twitter..."
              value={filters.referrer || ''}
              onChange={(e) => onChangeFilter('referrer', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* 8. Campaign Filter */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Campaign</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">?campaign=</span>
            </label>
            <input
              type="text"
              placeholder="e.g. summer_launch_2026..."
              value={filters.campaign || ''}
              onChange={(e) => onChangeFilter('campaign', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

        </div>
      )}
    </div>
  );
};
