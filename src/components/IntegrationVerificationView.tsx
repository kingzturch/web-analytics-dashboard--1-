import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Radio,
  HeartPulse,
  Zap,
  Key,
  Code2,
  Clock,
} from 'lucide-react';
import { Site } from '../types/analytics';
import { fetchIntegrationStatus } from '../lib/analytics';
import type { IntegrationStatus } from '../services/analyticsService';

interface IntegrationVerificationViewProps {
  site: Site;
}

function formatWhen(iso: string | null): string {
  if (!iso) return 'Belum ada';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const IntegrationVerificationView: React.FC<IntegrationVerificationViewProps> = ({ site }) => {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIntegrationStatus(site.id);
      setStatus(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [site.id]);

  useEffect(() => {
    load();
  }, [load]);

  const checklistItems = status
    ? [
        { key: 'createSite', label: 'Create Site', ok: status.checklist.createSite },
        { key: 'generateApiKey', label: 'Generate API Key', ok: status.checklist.generateApiKey },
        {
          key: 'trackerLoaded',
          label: 'tracker.js Loaded',
          ok: status.checklist.trackerLoaded,
          next: 'Pasang snippet dari tab Tracking lalu buka website asli.',
        },
        {
          key: 'firstPageView',
          label: 'First Page View Received',
          ok: status.checklist.firstPageView,
          next: 'Buka halaman website yang sudah dipasang tracker.',
        },
        {
          key: 'firstVisitor',
          label: 'First Visitor Received',
          ok: status.checklist.firstVisitor,
          next: 'Pastikan browser mengizinkan localStorage dan request collector tidak diblokir.',
        },
        {
          key: 'firstSession',
          label: 'First Session Created',
          ok: status.checklist.firstSession,
          next: 'Kirim pageview pertama agar collector membuat session.',
        },
        {
          key: 'heartbeatReceived',
          label: 'Heartbeat Received',
          ok: status.checklist.heartbeatReceived,
          next: 'Biarkan halaman website terbuka sampai heartbeat terkirim.',
        },
        {
          key: 'firstEvent',
          label: 'First Event Received',
          ok: status.checklist.firstEvent,
          next: 'Jalankan window.pulse.track(...) atau klik Test Connection.',
        },
        { key: 'dashboardUpdate', label: 'Dashboard Update', ok: status.checklist.dashboardUpdate },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Integration Verification</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Status integrasi live untuk <span className="font-mono text-zinc-200">{site.domain}</span>
              — tracker, koneksi, event, heartbeat, dan versi SDK.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition-colors self-start disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memuat...' : 'Refresh Status'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-mono">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatusCard
            icon={<Code2 className="w-4 h-4 text-emerald-400" />}
            label="Tracker terpasang"
            value={
              loading
                ? '…'
                : status?.trackerInstalled
                  ? 'Ya — telemetry diterima'
                  : 'Belum terdeteksi'
            }
            ok={!!status?.trackerInstalled}
          />
          <StatusCard
            icon={<Clock className="w-4 h-4 text-sky-400" />}
            label="Koneksi terakhir"
            value={loading ? '…' : formatWhen(status?.lastConnectionAt ?? null)}
            ok={!!status?.lastConnectionAt}
          />
          <StatusCard
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            label="Event terakhir"
            value={
              loading
                ? '…'
                : status?.lastEventAt
                  ? `${status.lastEventName || 'event'} · ${formatWhen(status.lastEventAt)}`
                  : 'Belum ada'
            }
            ok={!!status?.lastEventAt}
          />
          <StatusCard
            icon={<HeartPulse className="w-4 h-4 text-rose-400" />}
            label="Heartbeat terakhir"
            value={loading ? '…' : formatWhen(status?.lastHeartbeatAt ?? null)}
            ok={!!status?.lastHeartbeatAt}
          />
          <StatusCard
            icon={<Activity className="w-4 h-4 text-violet-400" />}
            label="Versi SDK"
            value={loading ? '…' : status?.sdkVersion || '—'}
            ok={!!status?.sdkVersion}
          />
          <StatusCard
            icon={<Key className="w-4 h-4 text-amber-400" />}
            label="API Key aktif"
            value={
              loading
                ? '…'
                : status?.hasActiveApiKey
                  ? 'Ada key aktif'
                  : 'Belum ada key aktif'
            }
            ok={!!status?.hasActiveApiKey}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <Metric label="Page Views" value={status?.pageViewCount ?? 0} />
          <Metric label="Visitors" value={status?.visitorCount ?? 0} />
          <Metric label="Sessions" value={status?.sessionCount ?? 0} />
          <Metric label="Events" value={status?.eventCount ?? 0} />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Production Checklist</h3>
        <p className="text-xs text-zinc-400">
          Create Site -&gt; Generate API Key -&gt; tracker.js Loaded -&gt; First Page View -&gt; First Visitor -&gt; First Session -&gt; Heartbeat -&gt; First Event -&gt; Dashboard Update
        </p>
        <div className="space-y-2">
          {checklistItems.map((item, index) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-zinc-500 w-5">{index + 1}.</span>
                <div className="space-y-0.5">
                  <span className="text-zinc-200 font-medium">{item.label}</span>
                  {!item.ok && item.next && (
                    <div className="text-[11px] text-zinc-500">{item.next}</div>
                  )}
                </div>
              </div>
              {item.ok ? (
                <span className="flex items-center space-x-1 text-emerald-400 font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PASS</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-zinc-500 font-mono font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>PENDING</span>
                </span>
              )}
            </div>
          ))}
          {loading && checklistItems.length === 0 && (
            <div className="text-xs text-zinc-500 font-mono p-3">Memuat checklist…</div>
          )}
        </div>
      </div>
    </div>
  );
};

function StatusCard({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono text-zinc-500">{label}</span>
        {icon}
      </div>
      <div className={`text-xs font-mono font-semibold truncate ${ok ? 'text-emerald-400' : 'text-zinc-400'}`}>
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
      <div className="text-[10px] uppercase font-mono text-zinc-500">{label}</div>
      <div className="text-sm font-bold text-white font-mono mt-1">{value}</div>
    </div>
  );
}
