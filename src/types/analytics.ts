// ==============================================================================
// DATABASE TYPES — re-exported from generated Supabase schema (single source)
// ==============================================================================

export type {
  Database,
  Json,
  SitesRow,
  SitesInsert,
  SitesUpdate,
  ApiKeysRow,
  ApiKeysInsert,
  ApiKeysUpdate,
  VisitorsRow,
  VisitorsInsert,
  VisitorsUpdate,
  SessionsRow,
  SessionsInsert,
  SessionsUpdate,
  PageViewsRow,
  PageViewsInsert,
  PageViewsUpdate,
  EventsRow,
  EventsInsert,
  EventsUpdate,
  AllowedDomainsRow,
  AllowedDomainsInsert,
  AllowedDomainsUpdate,
  SiteStatus,
  ApiKeyStatus,
  DeviceType,
  DbSite,
  DbApiKey,
  DbVisitor,
  DbSession,
  DbPageView,
  DbEvent,
  DbAllowedDomain,
} from '../lib/supabase/types';

import type {
  SitesRow,
  ApiKeysRow,
  VisitorsRow,
  SessionsRow,
  PageViewsRow,
  EventsRow,
  DeviceType,
  Json,
} from '../lib/supabase/types';

// ==============================================================================
// DOMAIN / FRONTEND COMPATIBILITY TYPES
// ==============================================================================

export interface Site extends SitesRow {
  owner_id?: string;
  public_access?: boolean;
}

export interface ApiKey extends ApiKeysRow {}

export interface Visitor extends VisitorsRow {
  country?: string;
  country_code?: string;
  browser?: string;
  os?: string;
  device?: DeviceType;
}

export interface Session extends SessionsRow {
  page_view_count?: number;
}

export interface PageView extends PageViewsRow {}

export interface AnalyticsEvent extends EventsRow {
  event_data?: Record<string, Json | undefined> | null;
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsSummaryMetrics {
  totalVisitors: number;
  uniqueVisitors: number;
  activeVisitors: number;
  sessionsCount: number;
  totalPageViews: number;
  total_sessions?: number;
  total_page_views?: number;
  latest_location?: string;
  latest_country_code?: string;
  latest_device?: DeviceType;
  latest_browser?: string;
  latest_os?: string;
  avgSessionDuration: number;
  avgDurationSeconds: number;
  bounceRate: number;
  pagesPerSession: number;
  visitorsChange: number;
  uniqueVisitorsChange: number;
  sessionsChange: number;
  pageViewsChange: number;
  bounceRateChange: number;
  durationChange: number;
  pagesPerSessionChange: number;
}

export interface AnalyticsSummary extends AnalyticsSummaryMetrics {
  summary: AnalyticsSummaryMetrics;
  timeSeries: TimeSeriesPoint[];
  topPages: BreakdownItem[];
  topReferrers: BreakdownItem[];
  topCountries: BreakdownItem[];
  topBrowsers: BreakdownItem[];
  topDevices: BreakdownItem[];
  recentEvents: Partial<AnalyticsEvent>[];
}

export interface TimeSeriesPoint {
  timestamp: string;
  formattedTime: string;
  visitors: number;
  uniqueVisitors: number;
  sessions: number;
  pageViews: number;
}

export interface RealtimeData {
  activeVisitorsCount: number;
  activeSessions: {
    sessionId: string;
    visitorId: string;
    currentUrl: string;
    landingPage: string;
    country: string;
    countryCode: string;
    browser: string;
    device: DeviceType;
    os: string;
    startedAt: string;
  }[];
  pagesOpen: BreakdownItem[];
  countries: BreakdownItem[];
  browsers: BreakdownItem[];
  devices: BreakdownItem[];
  landingPages: BreakdownItem[];
}

export interface BreakdownItem {
  name: string;
  code?: string;
  count: number;
  percentage: number;
}

export interface CustomEventSummary {
  name: string;
  count: number;
  uniqueVisitors: number;
}

export interface VisitorListItem {
  id: string;
  site_id: string;
  visitorUid?: string;
  visitor_uid?: string;
  identified_user?: string | null;
  firstSeen: string;
  lastSeen: string;
  lastSeenAt?: string;
  totalSessions: number;
  totalPageViews: number;
  total_sessions?: number;
  total_page_views?: number;
  latest_location?: string;
  latest_country_code?: string;
  latest_device?: DeviceType;
  latest_browser?: string;
  latest_os?: string;
  country: string;
  countryCode: string;
  device: DeviceType;
  browser: string;
  os: string;
}

export interface VisitorDetailData {
  visitor: VisitorListItem;
  sessions: {
    session: Session;
    pageViews: PageView[];
    events: AnalyticsEvent[];
  }[];
  allPageViews: PageView[];
  allEvents: AnalyticsEvent[];
}

export interface SessionDetailData {
  session: Session;
  visitor: VisitorListItem;
  durationFormatted: string;
  landingPage: string;
  exitPage: string;
  referrer: string;
  country: string;
  countryCode: string;
  browser: string;
  device: DeviceType;
  os: string;
  pageViewsTimeline: PageView[];
  eventsTimeline: AnalyticsEvent[];
}

export interface PageAnalyticsItem {
  url: string;
  path?: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgDuration: number;
  avgDurationFormatted: string;
  exitRate: number;
  avgScroll: number;
  bounceRate: number;
}

export interface PageDetailData {
  pageUrl: string;
  summary: PageAnalyticsItem;
  trafficTrend: TimeSeriesPoint[];
  topReferrers: BreakdownItem[];
  entryPages: BreakdownItem[];
  exitPages: BreakdownItem[];
  events: EventListItem[];
}

export interface EventListItem {
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
}

export interface EventsFilterParams {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  eventName?: string;
  category?: string;
  browser?: string;
  country?: string;
  device?: string;
  search?: string;
}

export interface CountryAnalyticsItem {
  country: string;
  code: string;
  flag?: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  avgDuration: number;
  avgDurationFormatted: string;
  topPages: { url: string; title: string; views: number }[];
}

export interface GlobalFilterState {
  siteId: string;
  from?: string;
  to?: string;
  country?: string;
  browser?: string;
  os?: string;
  device?: string;
  referrer?: string;
  campaign?: string;
}

export interface AcquisitionData {
  topReferrers: BreakdownItem[];
  topDomains: BreakdownItem[];
  utmSources: BreakdownItem[];
  utmMediums: BreakdownItem[];
  utmCampaigns: BreakdownItem[];
  searchEngines: BreakdownItem[];
  socialMedia: BreakdownItem[];
}

export interface TechnologyData {
  browsers: BreakdownItem[];
  browserVersions: BreakdownItem[];
  operatingSystems: BreakdownItem[];
  languages: BreakdownItem[];
  timezones: BreakdownItem[];
  screenResolutions: BreakdownItem[];
  viewports: BreakdownItem[];
  deviceTypes: BreakdownItem[];
}
