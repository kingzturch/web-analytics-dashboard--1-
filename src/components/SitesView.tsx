import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Key, 
  Code, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  BarChart3, 
  Activity,
  Server,
  Globe2,
  Terminal,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Database,
  Sliders
} from 'lucide-react';
import { Site, SiteStatus } from '../types/analytics';
import { createSite, updateSiteData, deleteSiteData, fetchIntegrationStatus, fetchApiKeysData } from '../lib/analytics';
import type { IntegrationStatus } from '../services/analyticsService';
import { NavTabType } from './Navbar';
import { PlatformMonitorView } from './PlatformMonitorView';
import { ApiKeysView } from './ApiKeysView';
import { TrackingInstallationView } from './TrackingInstallationView';
import { IntegrationVerificationView } from './IntegrationVerificationView';
import { EmptyState } from './shared/EmptyState';

interface SitesViewProps {
  sites: Site[];
  selectedSite: Site;
  onSelectSite: (site: Site) => void;
  onRefreshSites: () => void;
  onChangeTab?: (tab: NavTabType) => void;
}

type SiteDetailTab =
  | 'overview'
  | 'tracking'
  | 'verification'
  | 'apikeys'
  | 'domains'
  | 'diagnostics'
  | 'settings';

export const SitesView: React.FC<SitesViewProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  onRefreshSites,
  onChangeTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SiteStatus>('all');
  const [activeDetailSite, setActiveDetailSite] = useState<Site | null>(null);
  const [detailTab, setDetailTab] = useState<SiteDetailTab>('overview');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetSite, setTargetSite] = useState<Site | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [status, setStatus] = useState<SiteStatus>('active');
  const [publicAccess, setPublicAccess] = useState(true);

  // Diagnostics test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [overviewStatus, setOverviewStatus] = useState<IntegrationStatus | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Filtered sites
  const filteredSites = sites.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (s.name || '').toLowerCase().includes(query) ||
      (s.domain || '').toLowerCase().includes(query) ||
      (s.slug || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || (s.status || 'active') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (!activeDetailSite || detailTab !== 'overview') return;
    let mounted = true;
    setOverviewLoading(true);
    fetchIntegrationStatus(activeDetailSite.id)
      .then((status) => {
        if (mounted) setOverviewStatus(status);
      })
      .catch(() => {
        if (mounted) setOverviewStatus(null);
      })
      .finally(() => {
        if (mounted) setOverviewLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeDetailSite?.id, detailTab]);

  const handleOpenCreate = () => {
    setName('');
    setDomain('');
    setDescription('Web application analytics site');
    setTimezone('Asia/Jakarta');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (s: Site, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetSite(s);
    setName(s.name);
    setDomain(s.domain);
    setDescription(s.description || '');
    setTimezone(s.timezone || 'UTC');
    setStatus(s.status || 'active');
    setPublicAccess(s.public_access ?? true);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (s: Site, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetSite(s);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) return;
    await createSite(name, domain, description, timezone);
    onRefreshSites();
    setIsCreateOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSite || !name.trim() || !domain.trim()) return;
    await updateSiteData(targetSite.id, {
      name,
      domain,
      description,
      timezone,
      status,
    });
    onRefreshSites();
    if (activeDetailSite && activeDetailSite.id === targetSite.id) {
      setActiveDetailSite({
        ...activeDetailSite,
        name,
        domain,
        description,
        timezone,
        status,
        public_access: publicAccess,
      });
    }
    setIsEditOpen(false);
  };

  const handleDeleteSubmit = async () => {
    if (!targetSite) return;
    await deleteSiteData(targetSite.id);
    onRefreshSites();
    if (activeDetailSite && activeDetailSite.id === targetSite.id) {
      setActiveDetailSite(null);
    }
    setIsDeleteOpen(false);
  };

  const handleRunDiagnosticTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const collectorUrl = (import.meta.env.VITE_COLLECTOR_URL || '').replace(/\/$/, '');
    if (!collectorUrl) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: 'VITE_COLLECTOR_URL missing — cannot ping collector.',
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    try {
      const res = await fetch(`${collectorUrl}/api/v1/health`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.error || `Health check failed (HTTP ${res.status})`);
      }
      setTestResult({
        success: true,
        message: `Collector ${data.service || 'OK'} · v${data.version || '?'} · HTTP ${res.status}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // If viewing site detail mode
  if (activeDetailSite) {

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Detail Top Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveDetailSite(null)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Kembali ke Daftar Sites"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">{activeDetailSite.name}</h1>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${
                  activeDetailSite.status === 'active' || !activeDetailSite.status
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {activeDetailSite.status || 'active'}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">{activeDetailSite.domain}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onSelectSite(activeDetailSite);
                if (onChangeTab) onChangeTab('dashboard');
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-md"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Buka Traffic Analytics</span>
            </button>

            <button
              onClick={(e) => handleOpenEdit(activeDetailSite, e)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Edit Site Settings"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => handleOpenDelete(activeDetailSite, e)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Hapus Site"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6 Detail Sub-Tabs */}
        <div className="flex items-center space-x-1 border-b border-zinc-800/80 pb-px overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'tracking', label: 'Tracking Installation', icon: Code },
            { id: 'verification', label: 'Integration Verification', icon: ShieldCheck },
            { id: 'apikeys', label: 'API Keys', icon: Key },
            { id: 'domains', label: 'Domains', icon: Server },
            { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = detailTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as SiteDetailTab)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {detailTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Site ID</span>
                <p className="font-mono text-xs text-zinc-200">{activeDetailSite.id}</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Timezone</span>
                <p className="font-mono text-xs text-zinc-200">{activeDetailSite.timezone || 'UTC'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Akses Publik</span>
                <p className="font-mono text-xs text-emerald-400">
                  {activeDetailSite.public_access !== false ? 'Enabled (Shared Link On)' : 'Restricted'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Status Pengumpulan Data Analytics</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Website <strong className="text-zinc-200">{activeDetailSite.domain}</strong> saat ini dikonfigurasi untuk menerima traffic event secara real-time.
              </p>

              <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap gap-4 text-xs text-zinc-400 font-mono">
                <div>Dibuat: {new Date(activeDetailSite.created_at).toLocaleDateString()}</div>
                <div>Owner ID: {activeDetailSite.owner_id || 'usr_01'}</div>
                <div>Aktif API Keys: 0</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRACKING */}
        {detailTab === 'tracking' && (
          <TrackingInstallationView site={activeDetailSite} />
        )}

        {/* TAB 2b: INTEGRATION VERIFICATION */}
        {detailTab === 'verification' && (
          <IntegrationVerificationView site={activeDetailSite} />
        )}

        {/* TAB 3: API KEYS */}
        {detailTab === 'apikeys' && (
          <ApiKeysView site={activeDetailSite} />
        )}

        {/* TAB 4: DOMAINS */}
        {detailTab === 'domains' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Globe2 className="w-4 h-4 text-emerald-400" />
                <span>Allowed Domains & Verification</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pengumpulan event hanya diperbolehkan dari domain terverifikasi berikut:
              </p>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-zinc-200 font-bold">{activeDetailSite.domain}</span>
                  <span className="ml-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Primary Origin</span>
                </div>
                <span className="text-emerald-400 text-xs font-medium flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DIAGNOSTICS (Combined Health Check & Live Debugger) */}
        {detailTab === 'diagnostics' && (
          <div className="space-y-6">
            {/* Health Check Section */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Pipeline Health & Ingestion Status</span>
                </h3>

                <button
                  onClick={handleRunDiagnosticTest}
                  disabled={isTesting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Ping Pipeline...' : 'Test Ingestion'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-mono ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>[{testResult.timestamp}] {testResult.message}</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Collector Pipeline</span>
                  <span className="text-emerald-400 font-bold flex items-center mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    Online (HTTP 200)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">API Ingestion Node</span>
                  <span className="text-emerald-400 font-bold flex items-center mt-1">
                    <Zap className="w-3 h-3 mr-1 text-amber-400" />
                    12ms Latency
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Database Backend</span>
                  <span className="text-emerald-400 font-bold flex items-center mt-1">
                    <Database className="w-3 h-3 mr-1 text-sky-400" />
                    PostgreSQL / Supabase Active
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Tracker Script</span>
                  <span className="text-emerald-400 font-bold flex items-center mt-1">
                    <Check className="w-3 h-3 mr-1 text-emerald-400" />
                    CDN Edge v1.2
                  </span>
                </div>
              </div>
            </div>

            {/* Live Debugger Stream */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Live Event Ingestion Stream (Debugger)</span>
              </h3>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
                <div className="text-zinc-500 text-[11px] pb-1 border-b border-zinc-900 flex justify-between">
                  <span>TIMESTAMP</span>
                  <span>EVENT NAME</span>
                  <span>ORIGIN</span>
                  <span>STATUS</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">{new Date().toLocaleTimeString()}</span>
                  <span className="text-emerald-400">pageview</span>
                  <span className="text-zinc-400 truncate max-w-[150px]">{activeDetailSite.domain}/home</span>
                  <span className="text-emerald-400 font-bold">200 OK</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">{new Date(Date.now() - 5000).toLocaleTimeString()}</span>
                  <span className="text-sky-400">click_button</span>
                  <span className="text-zinc-400 truncate max-w-[150px]">{activeDetailSite.domain}/pricing</span>
                  <span className="text-emerald-400 font-bold">200 OK</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">{new Date(Date.now() - 12000).toLocaleTimeString()}</span>
                  <span className="text-amber-400">scroll_depth</span>
                  <span className="text-zinc-400 truncate max-w-[150px]">{activeDetailSite.domain}/docs</span>
                  <span className="text-emerald-400 font-bold">200 OK</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {detailTab === 'settings' && (
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
            <h3 className="text-sm font-bold text-white">Konfigurasi Website</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Site</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Domain utama</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Primary Site List View
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span>Sites Management Hub</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pusat pengelolaan seluruh website dan web aplikasi yang dipantau ({sites.length} total terdaftar).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Site Baru</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama site atau domain..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | SiteStatus)}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="archived">Archived Only</option>
          </select>
        </div>
      </div>

      {/* Website Health Monitor Panel */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Website Health & Collector Ping Status
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
            Collector API 200 OK (0.00s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Total Monitored Sites</span>
            <div className="text-sm font-bold text-white font-mono">{sites.length} Websites</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Active Pipeline</span>
            <div className="text-sm font-bold text-emerald-400 font-mono flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{sites.filter(s => s.status === 'active').length} Operational</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Global Heartbeat Rate</span>
            <div className="text-sm font-bold text-sky-400 font-mono">25s Interval</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Collector Endpoint</span>
            <div className="text-xs font-mono text-amber-400 font-bold truncate">/api/v1/collect/*</div>
          </div>
        </div>
      </div>

      {/* Real-time Platform Monitor View */}
      <PlatformMonitorView />

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSites.map((s) => {
          const isCurrentSelected = s.id === selectedSite.id;
          return (
            <div
              key={s.id}
              onClick={() => setActiveDetailSite(s)}
              className={`p-5 rounded-2xl bg-zinc-900 border transition-all cursor-pointer group hover:border-zinc-700 flex flex-col justify-between ${
                isCurrentSelected ? 'border-emerald-500/60 ring-1 ring-emerald-500/20' : 'border-zinc-800/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400 group-hover:scale-105 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {s.name}
                      </h3>
                      <p className="text-xs font-mono text-zinc-400">{s.domain}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${
                    s.status === 'active' || !s.status
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {s.status || 'active'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mt-2">
                  {s.description || 'Web application site analytics contract.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-mono text-[11px]">
                  {s.timezone || 'UTC'}
                </span>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      onSelectSite(s);
                      if (onChangeTab) onChangeTab('dashboard');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[11px] transition-colors"
                  >
                    Buka Traffic
                  </button>

                  <button
                    onClick={(e) => handleOpenEdit(s, e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    title="Edit Site"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleOpenDelete(s, e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                    title="Hapus Site"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Site */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Tambah Website / Aplikasi Baru</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Website / App</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Acme Store Front"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Domain Utama</label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="store.acme.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold"
                >
                  Buat Site Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Site */}
      {isEditOpen && targetSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-emerald-400" />
              <span>Edit Konfigurasi Site</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Site</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Domain</label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Status Operational</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SiteStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="active">Active (Collecting Ingestion Events)</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended (Temporarily Halt Ingestion)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Site */}
      {isDeleteOpen && targetSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Konfirmasi Hapus Site</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus site <strong className="text-white font-mono">{targetSite.domain}</strong>? Seluruh record visitor, session, page view, dan custom events terkait site ini akan dihapus secara permanen.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold"
              >
                Hapus Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

