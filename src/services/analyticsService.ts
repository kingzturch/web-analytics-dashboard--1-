import { AnalyticsRepository } from '../repositories/analyticsRepository';
import { SiteRepository } from '../repositories/siteRepository';
import { 
  TimeRange, 
  AnalyticsSummary, 
  TimeSeriesPoint, 
  BreakdownItem, 
  RealtimeData, 
  GlobalFilterState,
  VisitorListItem,
  VisitorDetailData,
  SessionDetailData,
  EventsFilterParams
} from '../types/analytics';

export interface IntegrationStatus {
  trackerInstalled: boolean;
  hasActiveApiKey: boolean;
  pageViewCount: number;
  sessionCount: number;
  eventCount: number;
  visitorCount: number;
  lastConnectionAt: string | null;
  lastPageViewAt: string | null;
  lastEventAt: string | null;
  lastEventName: string | null;
  lastHeartbeatAt: string | null;
  sdkVersion: string;
  collectorUrlConfigured: boolean;
  checklist: {
    createSite: boolean;
    generateApiKey: boolean;
    trackerLoaded: boolean;
    firstPageView: boolean;
    firstVisitor: boolean;
    firstSession: boolean;
    heartbeatReceived: boolean;
    firstEvent: boolean;
    dashboardUpdate: boolean;
  };
}
interface FilteredEventsResult {
  events: {
    id: string;
    time: string;
    event: string;
    category: string;
    action: string;
    label: string;
    value: string;
    page: string;
    visitorId: string;
    sessionId: string;
    browser: string;
    country: string;
    countryCode: string;
    device: string;
  }[];
  total: number;
  options: {
    eventNames: string[];
    categories: string[];
    browsers: string[];
    countries: string[];
    devices: string[];
  };
}
export class AnalyticsService {
  /**
   * Calculate startDate based on TimeRange
   */
  private static getStartDateForTimeRange(timeRange: TimeRange): string {
    const now = new Date();
    let days = 30;
    if (timeRange === '24h') days = 1;
    if (timeRange === '7d') days = 7;
    if (timeRange === '90d') days = 90;

    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * Main Dashboard Analytics Overview Summary
   */
  static async getAnalyticsSummary(
    siteId: string,
    timeRange: TimeRange,
    filter?: GlobalFilterState
  ): Promise<AnalyticsSummary> {
    const startDate = this.getStartDateForTimeRange(timeRange);
    
    // Fetch sessions, pageviews, and events in parallel from Supabase
    const [sessions, pageViews, events, onlineSessions] = await Promise.all([
      AnalyticsRepository.getSessions(siteId, startDate, undefined, filter),
      AnalyticsRepository.getPageViews(siteId, startDate, undefined),
      AnalyticsRepository.getEvents(siteId, startDate, undefined),
      AnalyticsRepository.getOnlineSessions(siteId),
    ]);

    const totalSessions = sessions.length;
    const totalPageViews = pageViews.length;

    // Distinct Visitors
    const visitorSet = new Set<string>();
    sessions.forEach(s => s.visitor_id && visitorSet.add(s.visitor_id));
    pageViews.forEach(p => p.visitor_id && visitorSet.add(p.visitor_id));
    const totalVisitors = visitorSet.size;

    // Active Visitors
    const activeVisitors = onlineSessions.length;

    // Bounce Rate (% of sessions with 1 pageview or page_count <= 1)
    const singlePageSessions = sessions.filter(s => (s.page_count || 1) <= 1).length;
    const bounceRate = totalSessions > 0 ? Math.round((singlePageSessions / totalSessions) * 100) : 0;

    // Average Duration
    const totalDuration = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const avgDurationSeconds = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    // Avg Pages Per Session
    const avgPagesPerSession = totalSessions > 0 
      ? Number((totalPageViews / totalSessions).toFixed(1)) 
      : 0;

    // Group TimeSeries
    const timeSeriesMap: Record<string, { visitors: Set<string>; pageViews: number; sessions: number }> = {};
    const daysCount = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;

    // Pre-populate time slots
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      let key = '';
      let label = '';
      if (timeRange === '24h') {
        const d = new Date(now.getTime() - i * 3600000);
        key = d.toISOString().substring(0, 13); // YYYY-MM-DDTHH
        label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        const d = new Date(now.getTime() - i * 86400000);
        key = d.toISOString().substring(0, 10); // YYYY-MM-DD
        label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      timeSeriesMap[key] = { visitors: new Set(), pageViews: 0, sessions: 0 };
    }

    // Aggregate pageviews into time series
    pageViews.forEach(pv => {
      const entryDate = new Date(pv.entered_at);
      const key = timeRange === '24h' 
        ? entryDate.toISOString().substring(0, 13)
        : entryDate.toISOString().substring(0, 10);

      if (timeSeriesMap[key]) {
        timeSeriesMap[key].pageViews++;
        if (pv.visitor_id) timeSeriesMap[key].visitors.add(pv.visitor_id);
      }
    });

    const timeSeries: TimeSeriesPoint[] = Object.keys(timeSeriesMap).map(key => {
      const d = timeRange === '24h' ? new Date(`${key}:00:00Z`) : new Date(`${key}T00:00:00Z`);
      const formatted = timeRange === '24h'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      return {
        timestamp: d.toISOString(),
        formattedTime: formatted,
        visitors: timeSeriesMap[key].visitors.size,
        uniqueVisitors: timeSeriesMap[key].visitors.size,
        sessions: timeSeriesMap[key].sessions,
        pageViews: timeSeriesMap[key].pageViews,
      };
    });

    // Top Pages
    const pageCounts: Record<string, number> = {};
    pageViews.forEach(pv => {
      const p = pv.path || pv.url || '/';
      pageCounts[p] = (pageCounts[p] || 0) + 1;
    });
    const topPages: BreakdownItem[] = Object.entries(pageCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Referrers
    const refCounts: Record<string, number> = {};
    sessions.forEach(s => {
      const ref = s.referrer || 'Direct / None';
      refCounts[ref] = (refCounts[ref] || 0) + 1;
    });
    const topReferrers: BreakdownItem[] = Object.entries(refCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Countries
    const countryCounts: Record<string, { count: number; code: string }> = {};
    sessions.forEach(s => {
      const c = s.country || 'Unknown';
      const code = s.country_code || 'XX';
      if (!countryCounts[c]) countryCounts[c] = { count: 0, code };
      countryCounts[c].count++;
    });
    const topCountries: BreakdownItem[] = Object.entries(countryCounts)
      .map(([name, val]) => ({
        name,
        code: val.code,
        count: val.count,
        percentage: totalSessions > 0 ? Math.round((val.count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Browsers
    const browserCounts: Record<string, number> = {};
    sessions.forEach(s => {
      const b = s.browser || 'Unknown';
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    });
    const topBrowsers: BreakdownItem[] = Object.entries(browserCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Devices
    const deviceCounts: Record<string, number> = {};
    sessions.forEach(s => {
      const d = s.device_type || 'desktop';
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });
    const topDevices: BreakdownItem[] = Object.entries(deviceCounts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent Events
    const recentEvents = events.slice(0, 10).map(e => ({
      id: e.id,
      site_id: e.site_id,
      event_name: e.event_name,
      event_category: e.event_category || 'general',
      event_action: e.event_action,
      event_label: e.event_label,
      occurred_at: e.occurred_at,
    }));

    const summary = {
      totalVisitors,
      uniqueVisitors: totalVisitors,
      activeVisitors,
      sessionsCount: totalSessions,
      totalPageViews,
      avgSessionDuration: avgDurationSeconds,
      avgDurationSeconds,
      bounceRate,
      pagesPerSession: avgPagesPerSession,
      visitorsChange: 0,
      uniqueVisitorsChange: 0,
      sessionsChange: 0,
      pageViewsChange: 0,
      bounceRateChange: 0,
      durationChange: 0,
      pagesPerSessionChange: 0,
    };

    return {
      ...summary,
      summary,
      timeSeries,
      topPages,
      topReferrers,
      topCountries,
      topBrowsers,
      topDevices,
      recentEvents: recentEvents,
    };
  }

  /**
   * Realtime Data Summary
   */
  static async getRealtimeData(siteId: string): Promise<RealtimeData> {
    const onlineSessions = await AnalyticsRepository.getOnlineSessions(siteId);

    const activeVisitors = onlineSessions.length;

    const pageCounts: Record<string, number> = {};
    const countryCounts: Record<string, { count: number; code: string }> = {};
    const deviceCounts: Record<string, number> = {};

    onlineSessions.forEach(s => {
      // Active Pages
      const page = s.exit_page || s.landing_page || '/';
      pageCounts[page] = (pageCounts[page] || 0) + 1;

      // Countries
      const c = s.country || 'Unknown';
      const code = s.country_code || 'XX';
      if (!countryCounts[c]) countryCounts[c] = { count: 0, code };
      countryCounts[c].count++;

      // Devices
      const d = s.device_type || 'desktop';
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });

    const activePages = Object.entries(pageCounts)
      .map(([path, activeCount]) => ({ path, title: path, activeCount }))
      .sort((a, b) => b.activeCount - a.activeCount);

    const activeCountries = Object.entries(countryCounts)
      .map(([country, val]) => ({ country, code: val.code, count: val.count }))
      .sort((a, b) => b.count - a.count);

    const activeDevices = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    return {
      activeVisitorsCount: activeVisitors,
      activeSessions: onlineSessions.map((s) => ({
        sessionId: s.id,
        visitorId: s.visitor_id,
        currentUrl: s.exit_page || s.landing_page || '/',
        landingPage: s.landing_page || '/',
        country: s.country || 'Unknown',
        countryCode: s.country_code || 'XX',
        browser: s.browser || 'Unknown',
        device: s.device_type || 'desktop',
        os: s.operating_system || 'Unknown',
        startedAt: s.started_at,
      })),
      pagesOpen: activePages.map((p) => ({ name: p.path, count: p.activeCount, percentage: activeVisitors ? Math.round((p.activeCount / activeVisitors) * 100) : 0 })),
      countries: activeCountries.map((c) => ({ name: c.country, code: c.code, count: c.count, percentage: activeVisitors ? Math.round((c.count / activeVisitors) * 100) : 0 })),
      browsers: [],
      devices: activeDevices.map((d) => ({ name: d.device, count: d.count, percentage: activeVisitors ? Math.round((d.count / activeVisitors) * 100) : 0 })),
      landingPages: activePages.map((p) => ({ name: p.path, count: p.activeCount, percentage: activeVisitors ? Math.round((p.activeCount / activeVisitors) * 100) : 0 })),
    };
  }

  /**
   * Visitors List with Pagination
   */
  static async getVisitorsList(
    siteId: string,
    page: number = 1,
    pageSize: number = 10,
    search: string = ''
  ): Promise<{ visitors: VisitorListItem[]; total: number; page: number; totalPages: number }> {
    const result = await AnalyticsRepository.getVisitors(siteId, page, pageSize, search);

    const visitors: VisitorListItem[] = result.visitors.map((v) => {
      const sessions = v.sessions || [];
      const latestSession = sessions[0];

      return {
        id: v.id,
        site_id: v.site_id,
        visitorUid: v.visitor_uid,
        visitor_uid: v.visitor_uid,
        identified_user: v.identified_user,
        firstSeen: v.first_seen_at,
        lastSeen: v.last_seen_at,
        lastSeenAt: v.last_seen_at,
        totalSessions: v.total_sessions || sessions.length,
        totalPageViews: v.total_page_views || 0,
        total_sessions: v.total_sessions || sessions.length,
        total_page_views: v.total_page_views || 0,
        country: latestSession?.country || 'Unknown',
        countryCode: latestSession?.country_code || 'XX',
        device: latestSession?.device_type || 'desktop',
        browser: latestSession?.browser || 'Unknown',
        os: latestSession?.operating_system || 'Unknown',
        latest_location: latestSession?.country ? `${latestSession.country}` : 'Unknown',
        latest_country_code: latestSession?.country_code || 'XX',
        latest_device: latestSession?.device_type || 'desktop',
        latest_browser: latestSession?.browser || 'Unknown',
        latest_os: latestSession?.operating_system || 'Unknown',
      };
    });

    return {
      visitors,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  /**
   * Visitor Detail
   */
  static async getVisitorDetail(siteId: string, visitorId: string): Promise<VisitorDetailData | null> {
    const data = await AnalyticsRepository.getVisitorById(siteId, visitorId);
    if (!data) return null;

    const sessions = (data.sessions || []).map((s) => ({
      ...s,
      pageViews: s.page_views || [],
      events: s.events || [],
    }));

    return {
      visitor: {
        id: data.id,
        site_id: data.site_id,
        visitorUid: data.visitor_uid,
        visitor_uid: data.visitor_uid,
        identified_user: data.identified_user,
        firstSeen: data.first_seen_at,
        lastSeen: data.last_seen_at,
        lastSeenAt: data.last_seen_at,
        totalSessions: data.total_sessions || sessions.length,
        totalPageViews: data.total_page_views || 0,
        country: sessions[0]?.country || 'Unknown',
        countryCode: sessions[0]?.country_code || 'XX',
        device: sessions[0]?.device_type || 'desktop',
        browser: sessions[0]?.browser || 'Unknown',
        os: sessions[0]?.operating_system || 'Unknown',
      },
      sessions: sessions.map((session) => ({ session, pageViews: session.pageViews || [], events: session.events || [] })),
      allPageViews: sessions.flatMap((session) => session.pageViews || []),
      allEvents: sessions.flatMap((session) => session.events || []),
    };
  }

  /**
   * Session Detail
   */
  static async getSessionDetail(siteId: string, sessionId: string): Promise<SessionDetailData | null> {
    const data = await AnalyticsRepository.getSessionById(siteId, sessionId);
    if (!data) return null;

    const session = data;
    const duration = session.duration_seconds || 0;
    return {
      session,
      visitor: {
        id: session.visitors?.id || session.visitor_id,
        site_id: session.site_id,
        visitorUid: session.visitors?.visitor_uid || session.visitor_id,
        firstSeen: session.visitors?.first_seen_at || session.started_at,
        lastSeen: session.visitors?.last_seen_at || session.last_activity_at,
        totalSessions: session.visitors?.total_sessions || 1,
        totalPageViews: session.visitors?.total_page_views || session.page_count || 0,
        country: session.country || 'Unknown',
        countryCode: session.country_code || 'XX',
        device: session.device_type || 'desktop',
        browser: session.browser || 'Unknown',
        os: session.operating_system || 'Unknown',
      },
      durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      landingPage: session.landing_page || '/',
      exitPage: session.exit_page || '/',
      referrer: session.referrer || 'Direct',
      country: session.country || 'Unknown',
      countryCode: session.country_code || 'XX',
      browser: session.browser || 'Unknown',
      device: session.device_type || 'desktop',
      os: session.operating_system || 'Unknown',
      pageViewsTimeline: session.page_views || [],
      eventsTimeline: session.events || [],
    };
  }

  /**
   * Page Analytics List
   */
  static async getPageAnalyticsList(siteId: string) {
    const pageViews = await AnalyticsRepository.getPageViews(siteId);

    const pagesMap: Record<string, { path: string; title: string; views: number; uniqueVisitors: Set<string>; totalDuration: number; exits: number }> = {};

    pageViews.forEach(pv => {
      const key = pv.path || pv.url || '/';
      if (!pagesMap[key]) {
        pagesMap[key] = {
          path: key,
          title: pv.title || key,
          views: 0,
          uniqueVisitors: new Set(),
          totalDuration: 0,
          exits: 0,
        };
      }
      pagesMap[key].views++;
      if (pv.visitor_id) pagesMap[key].uniqueVisitors.add(pv.visitor_id);
      if (pv.duration_seconds) pagesMap[key].totalDuration += pv.duration_seconds;
      if (pv.is_exit_page) pagesMap[key].exits++;
    });

    return Object.values(pagesMap).map(p => {
      const avgDuration = p.views > 0 ? Math.round(p.totalDuration / p.views) : 0;
      return {
        url: p.path,
        path: p.path,
        title: p.title,
        views: p.views,
        uniqueViews: p.uniqueVisitors.size,
        avgDuration,
        avgDurationFormatted: `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`,
        exitRate: p.views > 0 ? Math.round((p.exits / p.views) * 100) : 0,
        avgScroll: 0,
        bounceRate: 0,
      };
    }).sort((a, b) => b.views - a.views);
  }

  /**
   * Filtered Events
   */
  static async getFilteredEventsList(siteId: string, filters: EventsFilterParams): Promise<FilteredEventsResult> {
    const now = new Date();
    let startDate: string | undefined = filters.startDate;
    if (!startDate && filters.dateRange && filters.dateRange !== 'all') {
      const days = filters.dateRange === 'today' ? 1 : filters.dateRange === '7d' ? 7 : filters.dateRange === '90d' ? 90 : 30;
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    }

    const [rawEvents, sessions, pageViews] = await Promise.all([
      AnalyticsRepository.getEvents(siteId, startDate, filters.endDate, filters.category, filters.eventName),
      AnalyticsRepository.getSessions(siteId),
      AnalyticsRepository.getPageViews(siteId),
    ]);

    const sessionsById = new Map(sessions.map((session) => [session.id, session]));
    const pageViewsById = new Map(pageViews.map((pageView) => [pageView.id, pageView]));

    let items = rawEvents.map((event) => {
      const session = event.session_id ? sessionsById.get(event.session_id) : null;
      const pageView = event.page_view_id ? pageViewsById.get(event.page_view_id) : null;
      return {
        id: event.id,
        event: event.event_name,
        category: event.event_category || 'general',
        action: event.event_action || '',
        label: event.event_label || '',
        value: event.event_value,
        timestamp: event.occurred_at,
        page: pageView?.path || pageView?.url || '',
        visitorId: event.visitor_id || '',
        sessionId: event.session_id || '',
        browser: session?.browser || '',
        country: session?.country || '',
        countryCode: session?.country_code || '',
        device: session?.device_type || '',
      };
    });

    if (filters.browser) {
      items = items.filter((item) => item.browser.toLowerCase().includes(filters.browser!.toLowerCase()));
    }
    if (filters.country) {
      items = items.filter((item) => item.countryCode.toLowerCase() === filters.country!.toLowerCase() || item.country.toLowerCase() === filters.country!.toLowerCase());
    }
    if (filters.device) {
      items = items.filter((item) => item.device === filters.device);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((item) =>
        (item.event || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.action || '').toLowerCase().includes(q) ||
        (item.label || '').toLowerCase().includes(q) ||
        (item.page || '').toLowerCase().includes(q) ||
        (item.visitorId || '').toLowerCase().includes(q)
      );
    }

    return {
      events: items.map((item) => ({
        id: item.id,
        time: item.timestamp,
        event: item.event,
        category: item.category,
        action: item.action || '-',
        label: item.label || '-',
        value: item.value === null || item.value === undefined ? '-' : String(item.value),
        page: item.page || 'Unavailable',
        visitorId: item.visitorId,
        sessionId: item.sessionId,
        browser: item.browser || 'Unavailable',
        country: item.country || 'Unavailable',
        countryCode: item.countryCode || '',
        device: item.device || 'Unavailable',
      })),
      total: items.length,
      options: {
        eventNames: Array.from(new Set(items.map((item) => String(item.event || '')).filter(Boolean))),
        categories: Array.from(new Set(items.map((item) => String(item.category || '')).filter(Boolean))),
        browsers: Array.from(new Set(items.map((item) => item.browser).filter(Boolean))),
        countries: Array.from(new Set(items.map((item) => item.country || item.countryCode).filter(Boolean))),
        devices: Array.from(new Set(items.map((item) => item.device).filter(Boolean))),
      },
    };
  }
  /**
   * Integration Verification — live telemetry status for a real website install.
   */
  static async getIntegrationStatus(siteId: string): Promise<IntegrationStatus> {
    const [sessions, pageViews, events, apiKeys, site, visitorsResult] = await Promise.all([
      AnalyticsRepository.getSessions(siteId),
      AnalyticsRepository.getPageViews(siteId),
      AnalyticsRepository.getEvents(siteId),
      SiteRepository.getApiKeys(siteId),
      SiteRepository.getSiteById(siteId),
      AnalyticsRepository.getVisitors(siteId, 1, 1),
    ]);

    const latestSession = sessions[0] ?? null;
    const latestPageView = pageViews[0] ?? null;
    const latestEvent = events[0] ?? null;
    const activeKeys = apiKeys.filter((k) => k.status === 'active');

    const lastHeartbeatAt = latestSession?.last_activity_at ?? null;
    const lastConnectionAt =
      latestPageView?.entered_at ||
      latestEvent?.occurred_at ||
      lastHeartbeatAt ||
      null;

    const sdkVersion =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PULSE_SDK_VERSION) ||
      '1.0.0';
    const collectorUrlConfigured = Boolean(
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_COLLECTOR_URL
    );

    const firstPageView = pageViews.length > 0;
    const firstVisitor = visitorsResult.total > 0;
    const firstSession = sessions.length > 0;
    const heartbeatReceived = Boolean(lastHeartbeatAt);
    const firstEvent = events.length > 0;

    return {
      trackerInstalled: firstPageView || firstSession,
      hasActiveApiKey: activeKeys.length > 0,
      pageViewCount: pageViews.length,
      sessionCount: sessions.length,
      eventCount: events.length,
      visitorCount: visitorsResult.total,
      lastConnectionAt,
      lastPageViewAt: latestPageView?.entered_at ?? null,
      lastEventAt: latestEvent?.occurred_at ?? null,
      lastEventName: latestEvent?.event_name ?? null,
      lastHeartbeatAt,
      sdkVersion,
      collectorUrlConfigured,
      checklist: {
        createSite: !!site,
        generateApiKey: activeKeys.length > 0,
        trackerLoaded: firstPageView || firstSession,
        firstPageView,
        firstVisitor,
        firstSession,
        heartbeatReceived,
        firstEvent,
        dashboardUpdate: firstPageView || firstSession || firstEvent,
      },
    };
  }
}
