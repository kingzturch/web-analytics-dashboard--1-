import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  TrendingUp, 
  Compass, 
  ArrowRight, 
  LogIn, 
  LogOut, 
  Zap, 
  Clock, 
  Eye, 
  UserCheck, 
  Activity, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PageDetailData, Site } from '../types/analytics';
import { fetchPageDetail } from '../lib/analytics';

interface PageDetailModalProps {
  site: Site;
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVisitor?: (visitorId: string) => void;
  onSelectSession?: (sessionId: string) => void;
}

export const PageDetailModal: React.FC<PageDetailModalProps> = ({
  site,
  url,
  isOpen,
  onClose,
  onSelectVisitor,
  onSelectSession,
}) => {
  const [data, setData] = useState<PageDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'referrers' | 'navigation' | 'events'>('overview');

  useEffect(() => {
    if (isOpen && url) {
      setLoading(true);
      fetchPageDetail(site.id, url).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [site.id, url, isOpen]);

  if (!isOpen || !url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
                  PAGE ANALYTICS DETAIL
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {site.domain}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-mono truncate mt-0.5">
                {url}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center text-sm font-mono text-zinc-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching Page Deep Analytics & Traffic Trends...</span>
          </div>
        ) : !data ? (
          <div className="p-12 text-center text-sm font-mono text-zinc-500">
            Analytics data not found for page: {url}
          </div>
        ) : (
          <>
            {/* Top KPI Banner */}
            <div className="p-5 bg-zinc-950/80 border-b border-zinc-800 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
                {/* 1. Total Views */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Views</span>
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    {data.summary.views.toLocaleString()}
                  </div>
                </div>

                {/* 2. Unique Views */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Unique Views</span>
                  </div>
                  <div className="text-base font-bold text-sky-400">
                    {data.summary.uniqueViews.toLocaleString()}
                  </div>
                </div>

                {/* 3. Avg Duration */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Avg Duration</span>
                  </div>
                  <div className="text-base font-bold text-amber-400">
                    {data.summary.avgDurationFormatted}
                  </div>
                </div>

                {/* 4. Exit Rate */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Exit Rate</span>
                  </div>
                  <div className="text-base font-bold text-rose-400">
                    {data.summary.exitRate}%
                  </div>
                </div>

                {/* 5. Avg Scroll */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                    <span>Avg Scroll</span>
                  </div>
                  <div className="text-base font-bold text-purple-400">
                    {data.summary.avgScroll}%
                  </div>
                </div>

                {/* 6. Bounce Rate */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    <span>Bounce Rate</span>
                  </div>
                  <div className="text-base font-bold text-teal-400">
                    {data.summary.bounceRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Nav Tabs */}
            <div className="px-6 border-b border-zinc-800 bg-zinc-950/50 flex space-x-6 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Overview & Traffic Trend</span>
              </button>

              <button
                onClick={() => setActiveTab('referrers')}
                className={`py-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'referrers'
                    ? 'border-sky-400 text-sky-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Top Referrers ({data.topReferrers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('navigation')}
                className={`py-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'navigation'
                    ? 'border-purple-400 text-purple-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Entry & Exit Flow</span>
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`py-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'events'
                    ? 'border-amber-400 text-amber-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Events Pada Halaman ({data.events.length})</span>
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* TAB 1: OVERVIEW & TRAFFIC TREND */}
              {(activeTab === 'overview' || activeTab === 'traffic') && (
                <div className="space-y-6">
                  {/* Traffic Trend Chart */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white font-mono">Traffic Trend (Page Views over Time)</h3>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">Aggregated hourly timestamps</span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trafficTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="pageViewsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="formattedTime" stroke="#71717a" fontSize={11} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ color: '#10b981' }}
                          />
                          <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#pageViewsGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Summary Grids: Top Referrers & Entry/Exit Quick Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Referrer Quick Box */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-sky-400" />
                          <span>Top Referrer</span>
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-500">Source domain</span>
                      </div>

                      <div className="space-y-2">
                        {data.topReferrers.slice(0, 5).map((ref, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-zinc-200 truncate">{ref.name}</span>
                              <span className="text-sky-400 font-bold">{ref.count} ({ref.percentage}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${ref.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Entry Pages Quick Box */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <LogIn className="w-4 h-4 text-purple-400" />
                          <span>Entry Pages (Landing Traffic)</span>
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-500">Source URL</span>
                      </div>

                      <div className="space-y-2">
                        {data.entryPages.slice(0, 5).map((ep, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-zinc-200 truncate">{ep.name}</span>
                              <span className="text-purple-400 font-bold">{ep.count} ({ep.percentage}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${ep.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TOP REFERRERS */}
              {activeTab === 'referrers' && (
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Top Referrers for {url}</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 pb-2">
                          <th className="pb-2">Referrer Source</th>
                          <th className="pb-2 text-center">Referral Count</th>
                          <th className="pb-2 text-right">Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {data.topReferrers.map((ref, i) => (
                          <tr key={i} className="hover:bg-zinc-900/50">
                            <td className="py-2.5 text-zinc-200 font-bold flex items-center gap-2">
                              <Compass className="w-3.5 h-3.5 text-sky-400" />
                              <span>{ref.name}</span>
                            </td>
                            <td className="py-2.5 text-center text-amber-400 font-bold">{ref.count}</td>
                            <td className="py-2.5 text-right text-emerald-400 font-bold">
                              <div className="inline-flex items-center space-x-2">
                                <span>{ref.percentage}%</span>
                                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden inline-block">
                                  <div className="h-full bg-emerald-500" style={{ width: `${ref.percentage}%` }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ENTRY & EXIT FLOW */}
              {activeTab === 'navigation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Entry Pages */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
                    <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span>Entry Pages (Session Starts)</span>
                    </h3>
                    <div className="space-y-3">
                      {data.entryPages.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200">{item.name}</span>
                            <span className="text-purple-400 font-bold">{item.count} sessions</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exit Pages */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
                    <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span>Exit Pages (Session Ends)</span>
                    </h3>
                    <div className="space-y-3">
                      {data.exitPages.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200">{item.name}</span>
                            <span className="text-rose-400 font-bold">{item.count} sessions</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EVENTS PADA HALAMAN TERSEBUT */}
              {activeTab === 'events' && (
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Custom Events Triggered on {url}</span>
                    </h3>
                    <span className="text-xs text-zinc-500">{data.events.length} Events Total</span>
                  </div>

                  {data.events.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                      Belum ada event khusus yang terpicu pada halaman ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 pb-2">
                            <th className="pb-2 font-semibold">Time</th>
                            <th className="pb-2 font-semibold">Event</th>
                            <th className="pb-2 font-semibold">Category</th>
                            <th className="pb-2 font-semibold">Action</th>
                            <th className="pb-2 font-semibold">Label</th>
                            <th className="pb-2 font-semibold">Value</th>
                            <th className="pb-2 font-semibold">Visitor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {data.events.map((evt) => (
                            <tr key={evt.id} className="hover:bg-zinc-900/60">
                              <td className="py-2.5 pr-2 text-zinc-400 text-[11px] whitespace-nowrap">
                                {new Date(evt.time).toLocaleTimeString()}
                              </td>
                              <td className="py-2.5 px-2 font-bold text-amber-400 whitespace-nowrap">
                                {evt.event}
                              </td>
                              <td className="py-2.5 px-2 text-purple-400 font-semibold whitespace-nowrap">
                                {evt.category}
                              </td>
                              <td className="py-2.5 px-2 text-sky-300 font-mono">
                                {evt.action}
                              </td>
                              <td className="py-2.5 px-2 text-zinc-300 max-w-[150px] truncate">
                                {evt.label}
                              </td>
                              <td className="py-2.5 px-2 text-emerald-400 font-bold">
                                {evt.value}
                              </td>
                              <td className="py-2.5 pl-2 text-sky-400">
                                {onSelectVisitor ? (
                                  <button
                                    onClick={() => onSelectVisitor(evt.visitorId)}
                                    className="hover:underline font-bold text-sky-400"
                                  >
                                    {evt.visitorId}
                                  </button>
                                ) : (
                                  evt.visitorId
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between shrink-0 font-mono text-xs">
              <span className="text-zinc-500">Page Analytics &bull; Deep Insights</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
              >
                Close Page Detail
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
