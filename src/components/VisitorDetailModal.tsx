import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Globe, 
  Laptop, 
  Smartphone, 
  Cpu, 
  Clock, 
  Layers, 
  Eye, 
  Zap, 
  ChevronRight, 
  Calendar,
  ExternalLink,
  ArrowRight,
  Activity,
  UserCheck
} from 'lucide-react';
import { VisitorDetailData } from '../types/analytics';
import { fetchVisitorDetail } from '../lib/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';

interface VisitorDetailModalProps {
  siteId: string;
  visitorId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export const VisitorDetailModal: React.FC<VisitorDetailModalProps> = ({
  siteId,
  visitorId,
  isOpen,
  onClose,
  onSelectSession,
}) => {
  const [data, setData] = useState<VisitorDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'pageviews' | 'events'>('sessions');

  useEffect(() => {
    if (isOpen && visitorId) {
      setLoading(true);
      fetchVisitorDetail(siteId, visitorId).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [siteId, visitorId, isOpen]);

  if (!isOpen || !visitorId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono text-sm font-bold">
              VD
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white font-mono">Visitor Detail</h2>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                  {visitorId}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Complete timeline of sessions, page views, and custom events
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center text-sm font-mono text-zinc-400 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching Visitor Detail Records via Server Action...</span>
          </div>
        ) : !data ? (
          <div className="p-12 text-center text-sm font-mono text-zinc-500">
            Visitor details not found for ID: {visitorId}
          </div>
        ) : (
          <>
            {/* Visitor Metrics Grid Bar */}
            <div className="p-5 bg-zinc-950/60 border-b border-zinc-800 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {/* 1. Country */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Country</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                    <span>{getCountryFlag(data.visitor.countryCode)}</span>
                    <span>{data.visitor.country}</span>
                  </div>
                </div>

                {/* 2. Device & OS */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Device & OS</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-200 capitalize">
                    {data.visitor.device} ({data.visitor.os})
                  </div>
                </div>

                {/* 3. Browser */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-sky-400" />
                    <span>Browser</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-200">
                    {data.visitor.browser}
                  </div>
                </div>

                {/* 4. Total Sessions & Views */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Total Activity</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    {data.visitor.totalSessions} sessions / {data.visitor.totalPageViews} views
                  </div>
                </div>
              </div>

              {/* First Seen / Last Seen */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
                <div>
                  <span className="text-zinc-500">First Seen: </span>
                  <span className="text-zinc-300 font-medium">{new Date(data.visitor.firstSeen).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Last Seen: </span>
                  <span className="text-zinc-300 font-medium">{new Date(data.visitor.lastSeen).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs: Timeline Seluruh Session | Semua Page View | Semua Event */}
            <div className="px-6 border-b border-zinc-800 bg-zinc-950/40 flex space-x-6 text-xs font-semibold">
              <button
                onClick={() => setActiveSubTab('sessions')}
                className={`py-3 flex items-center space-x-2 border-b-2 transition-all ${
                  activeSubTab === 'sessions'
                    ? 'border-sky-400 text-sky-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Timeline Seluruh Session ({data.sessions.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('pageviews')}
                className={`py-3 flex items-center space-x-2 border-b-2 transition-all ${
                  activeSubTab === 'pageviews'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Semua Page View ({data.allPageViews.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('events')}
                className={`py-3 flex items-center space-x-2 border-b-2 transition-all ${
                  activeSubTab === 'events'
                    ? 'border-purple-400 text-purple-400 font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Semua Event ({data.allEvents.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* SUB TAB 1: Timeline Seluruh Session */}
              {activeSubTab === 'sessions' && (
                <div className="space-y-4">
                  {data.sessions.map((item, idx) => (
                    <div 
                      key={item.session.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-bold text-white font-mono">
                            Session #{item.session.id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">
                            Started: {new Date(item.session.started_at).toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => onSelectSession(item.session.id)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium transition-colors"
                        >
                          <span>Buka Detail Session</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Summary stats for this session */}
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono text-zinc-400">
                        <div>
                          <span className="text-zinc-500">Duration: </span>
                          <span className="text-amber-400 font-bold">{item.session.duration_seconds}s</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Page Views: </span>
                          <span className="text-emerald-400 font-bold">{item.pageViews.length}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Custom Events: </span>
                          <span className="text-purple-400 font-bold">{item.events.length}</span>
                        </div>
                      </div>

                      {/* Entry -> Exit */}
                      <div className="text-xs font-mono text-zinc-300 flex items-center space-x-2 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                        <span className="text-emerald-400 font-bold">{item.session.landing_page || '/'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-rose-400 font-bold">{item.session.exit_page || '/'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUB TAB 2: Semua Page View */}
              {activeSubTab === 'pageviews' && (
                <div className="space-y-2 font-mono text-xs">
                  {data.allPageViews.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500">No page views recorded.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-500">
                            <th className="pb-2 font-medium">Timestamp</th>
                            <th className="pb-2 font-medium">URL</th>
                            <th className="pb-2 font-medium">Title</th>
                            <th className="pb-2 font-medium">Referrer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {data.allPageViews.map(pv => (
                            <tr key={pv.id} className="hover:bg-zinc-950/40">
                              <td className="py-2.5 pr-3 text-zinc-400 shrink-0 whitespace-nowrap">
                                {new Date(pv.entered_at).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-400 max-w-[200px] truncate">
                                {pv.url}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-300 max-w-[180px] truncate">
                                {pv.title || '-'}
                              </td>
                              <td className="py-2.5 pl-3 text-zinc-500 max-w-[180px] truncate">
                                {pv.referrer || 'Direct'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUB TAB 3: Semua Event */}
              {activeSubTab === 'events' && (
                <div className="space-y-3 font-mono text-xs">
                  {data.allEvents.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500">No custom events recorded.</div>
                  ) : (
                    data.allEvents.map(evt => (
                      <div key={evt.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-400 text-sm">{evt.event_name}</span>
                          <span className="text-zinc-500 text-[11px]">{new Date(evt.created_at).toLocaleString()}</span>
                        </div>
                        {evt.event_data && (
                          <pre className="p-2 rounded bg-zinc-900 text-emerald-400/90 text-[11px] overflow-x-auto">
                            {JSON.stringify(evt.event_data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end shrink-0 font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Close Visitor Detail
          </button>
        </div>
      </div>
    </div>
  );
};
