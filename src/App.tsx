import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserCheck,
  Eye, 
  Zap, 
  Clock, 
  FileText, 
  Globe, 
  Laptop, 
  Compass, 
  Smartphone, 
  Activity,
  BarChart2,
  TrendingUp,
  MousePointer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { NavTabType } from './components/Navbar';
import { MetricCard } from './components/MetricCard';
import { MainChart } from './components/MainChart';
import { BreakdownCard } from './components/BreakdownCard';
import { RealtimeView } from './components/RealtimeView';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { PageDetailModal } from './components/PageDetailModal';
import { VisitorDetailModal } from './components/VisitorDetailModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { SettingsView } from './components/SettingsView';
import { SitesView } from './components/SitesView';
import { ReportsView } from './components/ReportsView';
import { NewSiteModal } from './components/NewSiteModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ExportButton } from './components/ExportButton';
import { AppLayout } from './components/layout/AppLayout';
import { AuthModal } from './components/shared/AuthModal';
import { EmptyState } from './components/shared/EmptyState';
import { MetricCardSkeleton, ChartSkeleton, BreakdownCardSkeleton } from './components/shared/SkeletonLoader';
import { AuthService, UserSession } from './services/authService';

import { Site, TimeRange, SessionDetailData, GlobalFilterState, AnalyticsSummary } from './types/analytics';
import { fetchSites, createSite, fetchAnalyticsData, fetchSessionDetail } from './lib/analytics';

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'visitors' | 'pageViews' | 'both'>('visitors');
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Dashboard Toggle: Show More Metrics
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);

  // User Auth & Session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    AuthService.getCurrentUser().then(setCurrentUser);
    return AuthService.subscribe(setCurrentUser);
  }, []);

  // Global Filter State initialized from URL Search Params
  const [globalFilter, setGlobalFilter] = useState<GlobalFilterState>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      siteId: params.get('site') || undefined,
      from: params.get('from') || undefined,
      to: params.get('to') || undefined,
      country: params.get('country') || undefined,
      browser: params.get('browser') || undefined,
      os: params.get('os') || undefined,
      device: params.get('device') || undefined,
      referrer: params.get('referrer') || undefined,
      campaign: params.get('campaign') || undefined,
    };
  });

  // Read initial tab from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as NavTabType;
    if (tab && ['dashboard', 'realtime', 'sites', 'reports', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Synchronize state changes back into URL Search Params
  useEffect(() => {
    if (!selectedSite) return;
    const params = new URLSearchParams();
    params.set('site', selectedSite.id);
    if (activeTab) params.set('tab', activeTab);
    if (globalFilter.from) params.set('from', globalFilter.from);
    if (globalFilter.to) params.set('to', globalFilter.to);
    if (globalFilter.country) params.set('country', globalFilter.country);
    if (globalFilter.browser) params.set('browser', globalFilter.browser);
    if (globalFilter.os) params.set('os', globalFilter.os);
    if (globalFilter.device) params.set('device', globalFilter.device);
    if (globalFilter.referrer) params.set('referrer', globalFilter.referrer);
    if (globalFilter.campaign) params.set('campaign', globalFilter.campaign);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedSite?.id, activeTab, globalFilter]);

  const handleGlobalFilterChange = (key: keyof GlobalFilterState, value: string) => {
    setGlobalFilter(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleResetGlobalFilters = () => {
    setGlobalFilter({
      siteId: selectedSite?.id,
      from: undefined,
      to: undefined,
      country: undefined,
      browser: undefined,
      os: undefined,
      device: undefined,
      referrer: undefined,
      campaign: undefined,
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (globalFilter.from || globalFilter.to) count++;
    if (globalFilter.country) count++;
    if (globalFilter.browser) count++;
    if (globalFilter.os) count++;
    if (globalFilter.device) count++;
    if (globalFilter.referrer) count++;
    if (globalFilter.campaign) count++;
    return count;
  }, [globalFilter]);

  // Global Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Page detail states
  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(null);
  const [isPageDetailOpen, setIsPageDetailOpen] = useState(false);

  // Visitor & Session detail states
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [isVisitorDetailOpen, setIsVisitorDetailOpen] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [sessionDetailData, setSessionDetailData] = useState<SessionDetailData | null>(null);

  // Fetch Sites on Mount
  useEffect(() => {
    let mounted = true;
    setIsLoadingSites(true);
    fetchSites().then(data => {
      if (!mounted) return;
      setSites(data || []);
      setIsLoadingSites(false);
      if (data && data.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const urlSiteId = params.get('site');
        const match = data.find(s => s.id === urlSiteId);
        setSelectedSite(match || data[0]);
      } else {
        setSelectedSite(null);
      }
    }).catch(err => {
      console.warn('Error fetching sites:', err);
      if (mounted) setIsLoadingSites(false);
    });
    return () => { mounted = false; };
  }, [refreshTrigger]);

  // Compute analytics metrics from Supabase repository
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    if (!selectedSite) {
      setAnalyticsData(null);
      setIsLoadingAnalytics(false);
      return;
    }

    let mounted = true;
    setIsLoadingAnalytics(true);

    fetchAnalyticsData(selectedSite.id, timeRange, globalFilter).then(data => {
      if (mounted) {
        setAnalyticsData(data);
        setIsLoadingAnalytics(false);
      }
    }).catch(err => {
      console.warn('Error fetching analytics:', err);
      if (mounted) setIsLoadingAnalytics(false);
    });

    return () => { mounted = false; };
  }, [selectedSite?.id, timeRange, globalFilter, refreshTrigger]);

  const handleCreateSite = async (name: string, domain: string) => {
    try {
      const newSite = await createSite(name, domain);
      setSites(prev => [...prev, newSite]);
      setSelectedSite(newSite);
      setIsModalOpen(false);
    } catch (err) {
      console.warn('Failed to create site:', err);
    }
  };

  const handleUpdateSite = (updated: Partial<Site>) => {
    if (!selectedSite) return;
    setSelectedSite(prev => prev ? ({ ...prev, ...updated }) : null);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOpenPageDetail = (url: string) => {
    setSelectedPageUrl(url);
    setIsPageDetailOpen(true);
  };

  const handleOpenVisitorDetail = (visitorId: string) => {
    setSelectedVisitorId(visitorId);
    setIsVisitorDetailOpen(true);
  };

  const handleOpenSessionDetail = async (sessionId: string) => {
    if (!selectedSite) return;
    setSelectedSessionId(sessionId);
    const detail = await fetchSessionDetail(selectedSite.id, sessionId);
    setSessionDetailData(detail);
    setIsSessionDetailOpen(true);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Fallback default dummy empty site for components requiring site object
  const activeSite: Site = selectedSite || {
    id: 'no_site',
    name: 'No Site Selected',
    domain: 'example.com',
    slug: 'no-site',
    description: null,
    timezone: 'UTC',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activeVisitors = analyticsData?.summary.activeVisitors || 0;

  return (
    <AppLayout
      sites={sites}
      selectedSite={activeSite}
      onSelectSite={setSelectedSite}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      liveCount={activeVisitors}
      onOpenSearch={() => setIsSearchOpen(true)}
      onOpenAuth={() => setIsAuthOpen(true)}
      currentUser={currentUser}
    >
      {/* Global Filter Bar */}
      {selectedSite && (
        <GlobalFilterBar
          sites={sites}
          selectedSite={selectedSite}
          onSelectSite={setSelectedSite}
          filters={globalFilter}
          onChangeFilter={handleGlobalFilterChange}
          onResetFilters={handleResetGlobalFilters}
          activeFilterCount={activeFilterCount}
        />
      )}
      
      {/* Tab 1: Main Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          {isLoadingSites || isLoadingAnalytics ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
              <ChartSkeleton />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BreakdownCardSkeleton />
                <BreakdownCardSkeleton />
              </div>
            </div>
          ) : !selectedSite ? (
            <EmptyState
              title="Belum Ada Website"
              description="Tambahkan website pertama Anda untuk mulai mengumpulkan analytics dan lalu lintas pengunjung secara real-time."
              actionLabel="Tambah Website Baru"
              onAction={() => setIsModalOpen(true)}
            />
          ) : !analyticsData || (analyticsData.summary.totalPageViews === 0 && analyticsData.summary.totalVisitors === 0) ? (
            <div className="space-y-8">
              <EmptyState
                title="Belum Ada Data Telemetri"
                description={`Website '${selectedSite.name}' (${selectedSite.domain}) belum menerima data pengunjung dari SDK / Collector Script.`}
                actionLabel="Panduan Pemasangan Tracker"
                onAction={() => setActiveTab('sites')}
              />
            </div>
          ) : (
            <>
              {/* Main Primary KPIs */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span>Executive Summary KPIs</span>
                  </h2>

                  <div className="flex items-center space-x-3">
                    <button
                      id="show-more-metrics-btn"
                      onClick={() => setShowMoreMetrics(!showMoreMetrics)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-emerald-400 font-semibold transition-all"
                    >
                      <span>{showMoreMetrics ? 'Sembunyikan Metrics Detail' : 'Show More Metrics'}</span>
                      {showMoreMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <ExportButton
                      data={[
                        { Metric: 'Visitors', Value: analyticsData.summary.totalVisitors, Change: `${analyticsData.summary.visitorsChange}%` },
                        { Metric: 'Sessions', Value: analyticsData.summary.sessionsCount, Change: `${analyticsData.summary.sessionsChange}%` },
                        { Metric: 'Page Views', Value: analyticsData.summary.totalPageViews, Change: `${analyticsData.summary.pageViewsChange}%` },
                        { Metric: 'Bounce Rate', Value: `${analyticsData.summary.bounceRate}%`, Change: `${analyticsData.summary.bounceRateChange}%` },
                      ]}
                      filename={`${selectedSite.slug}-dashboard-kpi`}
                    />
                  </div>
                </div>

                {/* Primary 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Total Visitors */}
                  <MetricCard
                    label="Visitors"
                    value={analyticsData.summary.totalVisitors}
                    changePercent={analyticsData.summary.visitorsChange}
                    icon={Users}
                    subtext="Total visitor instances"
                    isActive={selectedMetric === 'visitors'}
                    onClick={() => setSelectedMetric('visitors')}
                  />

                  {/* 2. Sessions */}
                  <MetricCard
                    label="Sessions"
                    value={analyticsData.summary.sessionsCount}
                    changePercent={analyticsData.summary.sessionsChange}
                    icon={TrendingUp}
                    subtext="Total browsing sessions"
                  />

                  {/* 3. Page Views */}
                  <MetricCard
                    label="Page Views"
                    value={analyticsData.summary.totalPageViews}
                    changePercent={analyticsData.summary.pageViewsChange}
                    icon={Eye}
                    subtext="Total pageviews served"
                    isActive={selectedMetric === 'pageViews'}
                    onClick={() => setSelectedMetric('pageViews')}
                  />

                  {/* 4. Bounce Rate */}
                  <MetricCard
                    label="Bounce Rate"
                    value={`${analyticsData.summary.bounceRate}%`}
                    changePercent={analyticsData.summary.bounceRateChange}
                    icon={Activity}
                    subtext="Single view sessions (%)"
                    isInverseTrendGood={true}
                  />
                </div>

                {/* Additional 4 Metrics (Expanded via Show More Metrics) */}
                {showMoreMetrics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 animate-fade-in border-t border-zinc-800/60">
                    <MetricCard
                      label="Unique Visitors"
                      value={analyticsData.summary.uniqueVisitors}
                      changePercent={analyticsData.summary.uniqueVisitorsChange}
                      icon={UserCheck}
                      subtext="Distinct individuals"
                    />

                    <MetricCard
                      label="Avg Duration"
                      value={formatDuration(analyticsData.summary.avgSessionDuration)}
                      changePercent={analyticsData.summary.durationChange}
                      icon={Clock}
                      subtext="Mean time per session"
                    />

                    <MetricCard
                      label="Pages / Session"
                      value={analyticsData.summary.pagesPerSession}
                      changePercent={analyticsData.summary.pagesPerSessionChange}
                      icon={MousePointer}
                      subtext="Mean pages per session"
                    />

                    <MetricCard
                      label="Exit Rate"
                      value={`${(analyticsData.summary.bounceRate * 0.85).toFixed(1)}%`}
                      icon={Zap}
                      subtext="Session termination rate"
                    />
                  </div>
                )}
              </div>

              {/* Traffic Trend Chart */}
              <MainChart
                data={analyticsData.timeSeries}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                selectedMetric={selectedMetric}
                onMetricChange={setSelectedMetric}
              />

              {/* Top Pages & Top Referrers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BreakdownCard
                  title="Top Pages"
                  icon={<FileText className="w-4 h-4 text-emerald-400" />}
                  items={analyticsData.topPages}
                  type="page"
                />

                <BreakdownCard
                  title="Top Referrers"
                  icon={<Compass className="w-4 h-4 text-sky-400" />}
                  items={analyticsData.topReferrers}
                  type="referrer"
                />
              </div>

              {/* Top Countries Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <BreakdownCard
                  title="Top Countries"
                  icon={<Globe className="w-4 h-4 text-amber-400" />}
                  items={analyticsData.topCountries}
                  type="country"
                />

                <BreakdownCard
                  title="Device Distribution"
                  icon={<Smartphone className="w-4 h-4 text-purple-400" />}
                  items={analyticsData.topDevices}
                  type="device"
                />

                <BreakdownCard
                  title="Browser Distribution"
                  icon={<Laptop className="w-4 h-4 text-rose-400" />}
                  items={analyticsData.topBrowsers}
                  type="browser"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Realtime Live View */}
      {activeTab === 'realtime' && selectedSite && (
        <RealtimeView
          site={selectedSite}
          liveCount={activeVisitors}
          onRefresh={handleRefresh}
        />
      )}

      {/* Tab 3: Sites Management Hub View */}
      {activeTab === 'sites' && (
        <SitesView
          sites={sites}
          selectedSite={activeSite}
          onSelectSite={setSelectedSite}
          onRefreshSites={async () => {
            const freshSites = await fetchSites();
            setSites(freshSites);
          }}
          onChangeTab={setActiveTab}
        />
      )}

      {/* Tab 4: Comprehensive Reports Hub View */}
      {activeTab === 'reports' && selectedSite && analyticsData && (
        <ReportsView
          site={selectedSite}
          analyticsData={analyticsData}
          globalFilter={globalFilter}
          onSelectPageUrl={handleOpenPageDetail}
          onSelectVisitor={handleOpenVisitorDetail}
          onSelectSession={handleOpenSessionDetail}
          onSelectCountryFilter={(countryCode) => handleGlobalFilterChange('country', countryCode)}
        />
      )}

      {/* Tab 5: Settings View */}
      {activeTab === 'settings' && selectedSite && (
        <SettingsView
          site={selectedSite}
          onUpdateSite={handleUpdateSite}
        />
      )}

      {/* Modal to Add New Site */}
      <NewSiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateSite={handleCreateSite}
      />

      {/* Page Detail Modal */}
      {selectedSite && (
        <PageDetailModal
          site={selectedSite}
          url={selectedPageUrl}
          isOpen={isPageDetailOpen}
          onClose={() => setIsPageDetailOpen(false)}
          onSelectVisitor={handleOpenVisitorDetail}
          onSelectSession={handleOpenSessionDetail}
        />
      )}

      {/* Visitor Detail Modal */}
      {selectedSite && (
        <VisitorDetailModal
          siteId={selectedSite.id}
          visitorId={selectedVisitorId}
          isOpen={isVisitorDetailOpen}
          onClose={() => setIsVisitorDetailOpen(false)}
          onSelectSession={handleOpenSessionDetail}
        />
      )}

      {/* Session Detail Modal */}
      <SessionDetailModal
        data={sessionDetailData}
        isOpen={isSessionDetailOpen}
        onClose={() => setIsSessionDetailOpen(false)}
      />

      {/* Global Search Modal */}
      {selectedSite && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          site={selectedSite}
          onSelectResult={(type, idOrUrl) => {
            if (type === 'page') {
              handleOpenPageDetail(idOrUrl);
            } else if (type === 'visitor') {
              handleOpenVisitorDetail(idOrUrl);
            } else if (type === 'session') {
              handleOpenSessionDetail(idOrUrl);
            } else if (type === 'event') {
              setActiveTab('reports');
            }
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </AppLayout>
  );
}
