import React, { useState, useEffect } from 'react';
import {
  Radio,
  Globe,
  RefreshCw,
  Monitor,
  Smartphone,
  Compass,
  MapPin,
  Layers,
  Laptop,
} from 'lucide-react';
import { Site, RealtimeData } from '../types/analytics';
import { subscribeToRealtimeAnalytics, fetchRealtimeData } from '../lib/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';
import { BreakdownCard } from './BreakdownCard';
import { EmptyState } from './shared/EmptyState';

interface RealtimeViewProps {
  site: Site;
  liveCount: number;
  onRefresh: () => void;
}

export const RealtimeView: React.FC<RealtimeViewProps> = ({ site, liveCount, onRefresh }) => {
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchRealtimeData(site.id)
      .then((data) => {
        if (isMounted) setRealtimeData(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = subscribeToRealtimeAnalytics(site.id, (freshData) => {
      if (isMounted) setRealtimeData(freshData);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [site.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await fetchRealtimeData(site.id);
      setRealtimeData(fresh);
      setError(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  };

  const activeCount = realtimeData?.activeVisitorsCount ?? liveCount;

  if (isLoading && !realtimeData) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs flex items-center justify-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Loading live sessions…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/90 border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>LIVE POLLING · 5s</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3 flex-wrap">
              <span className="font-mono text-emerald-400">{activeCount}</span>
              <span className="text-zinc-300 text-xl sm:text-3xl font-sans font-medium">
                Active visitors
              </span>
            </h2>

            <p className="text-zinc-400 text-sm max-w-xl">
              Sessions active in the last 5 minutes for{' '}
              <span className="text-zinc-200 font-mono">{site.domain}</span>.
            </p>
          </div>

          <button
            id="simulate-traffic-btn"
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all font-mono disabled:opacity-50 shrink-0 self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh live data'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-mono relative z-10">
            {error}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Active sessions ({realtimeData?.activeSessions.length || 0})</span>
          </h3>
        </div>

        {!realtimeData?.activeSessions || realtimeData.activeSessions.length === 0 ? (
          <EmptyState
            title="No active sessions"
            description="Open your website with the tracker installed, or use Test Connection in Installation Manager."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="pb-2 font-medium">Country</th>
                  <th className="pb-2 font-medium">Current page</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Landing</th>
                  <th className="pb-2 font-medium">Device</th>
                  <th className="pb-2 font-medium hidden md:table-cell">Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {realtimeData.activeSessions.map((session) => (
                  <tr key={session.sessionId} className="hover:bg-zinc-950/40 transition-colors">
                    <td className="py-2.5 pr-3 text-zinc-300">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-base">{getCountryFlag(session.countryCode)}</span>
                        <span className="font-sans text-xs">{session.country}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold max-w-[200px] truncate">
                      {session.currentUrl}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 max-w-[180px] truncate hidden sm:table-cell">
                      {session.landingPage}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 capitalize">
                      <span className="inline-flex items-center gap-1.5">
                        {session.device === 'desktop' ? (
                          <Laptop className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span>
                          {session.device} ({session.os})
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-zinc-400 hidden md:table-cell">
                      {session.browser}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BreakdownCard
          title="Pages open"
          icon={<Globe className="w-4 h-4" />}
          items={realtimeData?.pagesOpen || []}
        />
        <BreakdownCard
          title="Countries"
          icon={<MapPin className="w-4 h-4" />}
          items={realtimeData?.countries || []}
        />
        <BreakdownCard
          title="Landing pages"
          icon={<Layers className="w-4 h-4" />}
          items={realtimeData?.landingPages || []}
        />
        <BreakdownCard
          title="Browsers"
          icon={<Compass className="w-4 h-4" />}
          items={realtimeData?.browsers || []}
        />
        <BreakdownCard
          title="Devices"
          icon={<Monitor className="w-4 h-4" />}
          items={realtimeData?.devices || []}
        />
      </div>
    </div>
  );
};
