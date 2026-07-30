import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { SystemMetrics } from '../services/queueService';

export const PlatformMonitorView: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/v1/monitor/stats');
      if (!res.ok) {
        throw new Error(`Monitor API HTTP ${res.status}`);
      }
      const data = await res.json();
      setMetrics(data);
      setError(null);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !metrics) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs flex items-center justify-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Loading operational metrics…</span>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-900 border border-rose-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-rose-400 text-sm font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>Platform monitor unavailable</span>
        </div>
        <p className="text-xs text-zinc-400 font-mono">{error}</p>
        <button
          type="button"
          onClick={fetchMetrics}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const m = metrics;
  const collectorOk = m.collectorStatus === 'online';
  const dbOk = m.supabaseStatus === 'connected';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <Server className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-wide font-mono">
                Platform Monitor
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Live queue, worker, and database health from /api/v1/monitor/stats
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMetrics}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-300 font-mono transition-all self-start"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh ({lastRefreshed || '—'})</span>
          </button>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-mono">
            Last refresh warning: {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Collector</span>
              {collectorOk ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className={`text-sm font-bold font-mono ${collectorOk ? 'text-emerald-400' : 'text-amber-400'}`}>
              {m.collectorStatus}
            </div>
            <span className="text-[10px] font-mono text-zinc-500 block">v{m.collectorVersion}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Supabase</span>
              <Database className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className={`text-sm font-bold font-mono ${dbOk ? 'text-sky-400' : 'text-amber-400'}`}>
              {m.supabaseStatus}
            </div>
            <span className="text-[10px] font-mono text-zinc-500 block">
              Avg insert {m.avgInsertTimeMs === null ? 'No samples yet' : String(m.avgInsertTimeMs) + 'ms'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Queue</span>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {m.queueLength === 0 ? 'Idle' : String(m.queueLength) + ' buffered'}
            </div>
            <span className="text-[10px] font-mono text-zinc-500 block">
              Retry: {m.retryQueueLength}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Integrity</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {m.droppedEvents} dropped
            </div>
            <span className="text-[10px] font-mono text-zinc-500 block">
              Failed inserts: {m.failedInserts}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase font-mono">Velocity</h3>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Requests / sec</span>
              <span className="font-bold text-white">{m.requestsPerSec}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Events / sec</span>
              <span className="font-bold text-emerald-400">{m.eventsPerSec}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Last processed</span>
              <span className="font-bold text-zinc-300 truncate max-w-[140px]">
                {m.lastProcessedAt
                  ? new Date(m.lastProcessedAt).toLocaleTimeString()
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase font-mono">Workers</h3>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Active workers</span>
              <span className="font-bold text-white">{m.activeWorkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Failed inserts</span>
              <span className="font-bold text-white">{m.failedInserts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Avg insert</span>
              <span className="font-bold text-emerald-400">{m.avgInsertTimeMs === null ? 'No samples yet' : `${m.avgInsertTimeMs}ms`}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase font-mono">Versions</h3>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">SDK</span>
              <span className="font-bold text-white">v{m.sdkVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Collector</span>
              <span className="font-bold text-white">v{m.collectorVersion}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




