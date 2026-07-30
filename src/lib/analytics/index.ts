import { SiteRepository } from '../../repositories/siteRepository';
import { AnalyticsService } from '../../services/analyticsService';
import type {
  SitesRow,
  SitesUpdate,
  ApiKeysRow,
} from '../../lib/supabase/types';
import { 
  TimeRange, 
  AnalyticsSummary, 
  RealtimeData, 
  VisitorListItem, 
  VisitorDetailData, 
  SessionDetailData,
  GlobalFilterState,
  EventsFilterParams
} from '../../types/analytics';

/**
 * Server Actions & Analytical Query Services
 * Single source of truth querying Supabase via SiteRepository & AnalyticsService.
 */

export async function fetchVisitors(
  siteId: string,
  page: number = 1,
  pageSize: number = 10,
  search: string = ''
): Promise<{ visitors: VisitorListItem[]; total: number; page: number; totalPages: number }> {
  return AnalyticsService.getVisitorsList(siteId, page, pageSize, search);
}

export async function fetchVisitorDetail(
  siteId: string,
  visitorId: string
): Promise<VisitorDetailData | null> {
  return AnalyticsService.getVisitorDetail(siteId, visitorId);
}

export async function fetchSessionDetail(
  siteId: string,
  sessionId: string
): Promise<SessionDetailData | null> {
  return AnalyticsService.getSessionDetail(siteId, sessionId);
}

export async function fetchSites(): Promise<SitesRow[]> {
  return SiteRepository.getAllSites();
}

export async function createSite(
  name: string,
  domain: string,
  description?: string,
  timezone?: string
): Promise<SitesRow> {
  return SiteRepository.createSite(name, domain, description, timezone);
}

export async function updateSiteData(siteId: string, updates: SitesUpdate): Promise<SitesRow | null> {
  return SiteRepository.updateSite(siteId, updates);
}

export async function deleteSiteData(siteId: string): Promise<boolean> {
  return SiteRepository.deleteSite(siteId);
}

/**
 * SHA-256 helper for hashing API keys securely
 */
export async function hashSecretKey(rawKey: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('SubtleCrypto error:', e);
    }
  }
  let h = 0;
  for (let i = 0; i < rawKey.length; i++) {
    h = (h << 5) - h + rawKey.charCodeAt(i);
    h |= 0;
  }
  return `sha256_${Math.abs(h).toString(16)}_${rawKey.slice(-12)}`;
}

export async function fetchApiKeysData(siteId: string): Promise<ApiKeysRow[]> {
  return SiteRepository.getApiKeys(siteId);
}

export async function createApiKeyData(
  siteId: string,
  name: string,
  expiresAt?: string | null
): Promise<{ apiKey: ApiKeysRow; rawSecret: string }> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 32; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const rawSecret = `pa_live_sec_${randomPart}`;
  const keyHash = await hashSecretKey(rawSecret);
  const keyPrefix = `pa_live_${rawSecret.substring(12, 20)}...`;

  const apiKey = await SiteRepository.createApiKey(siteId, name, keyHash, keyPrefix, expiresAt);
  return { apiKey, rawSecret };
}

export async function revokeApiKeyData(_siteId: string, keyId: string): Promise<boolean> {
  return SiteRepository.revokeApiKey(keyId);
}

export async function regenerateApiKeyData(
  _siteId: string,
  keyId: string
): Promise<{ apiKey: ApiKeysRow; rawSecret: string } | null> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 32; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const rawSecret = `pa_live_sec_${randomPart}`;
  const keyHash = await hashSecretKey(rawSecret);
  const keyPrefix = `pa_live_${rawSecret.substring(12, 20)}...`;

  const apiKey = await SiteRepository.regenerateApiKey(keyId, keyHash, keyPrefix);
  return { apiKey, rawSecret };
}

export async function fetchAnalyticsData(
  siteId: string,
  timeRange: TimeRange,
  filter?: GlobalFilterState
): Promise<AnalyticsSummary> {
  return AnalyticsService.getAnalyticsSummary(siteId, timeRange, filter);
}

export async function fetchRealtimeData(siteId: string): Promise<RealtimeData> {
  return AnalyticsService.getRealtimeData(siteId);
}

/**
 * Realtime Subscription Handler
 */
export function subscribeToRealtimeAnalytics(
  siteId: string,
  onUpdate: (data: RealtimeData) => void
) {
  const interval = setInterval(async () => {
    try {
      const freshRealtime = await fetchRealtimeData(siteId);
      onUpdate(freshRealtime);
    } catch (e) {
      console.warn('Realtime polling error:', e);
    }
  }, 5000);

  return () => clearInterval(interval);
}

export async function fetchPageAnalytics(siteId: string) {
  return AnalyticsService.getPageAnalyticsList(siteId);
}

export async function fetchPageDetail(siteId: string, url: string) {
  const pages = await AnalyticsService.getPageAnalyticsList(siteId);
  const summary = pages.find(p => p.url === url) || null;
  if (!summary) return null;
  return {
    pageUrl: url,
    summary,
    trafficTrend: [],
    topReferrers: [],
    entryPages: [],
    exitPages: [],
    events: [],
  };
}

export async function fetchFilteredEvents(
  siteId: string,
  filters: EventsFilterParams
) {
  return AnalyticsService.getFilteredEventsList(siteId, filters);
}

export async function fetchAcquisitionData(siteId: string) {
  const summary = await AnalyticsService.getAnalyticsSummary(siteId, '30d');
  return {
    topReferrers: summary.topReferrers,
    topDomains: summary.topReferrers,
    utmSources: [],
    utmMediums: [],
    utmCampaigns: [],
    searchEngines: [],
    socialMedia: [],
  };
}

export async function fetchTechnologyData(siteId: string) {
  const summary = await AnalyticsService.getAnalyticsSummary(siteId, '30d');
  return {
    browsers: summary.topBrowsers,
    browserVersions: [],
    operatingSystems: [],
    languages: [],
    timezones: [],
    screenResolutions: [],
    viewports: [],
    deviceTypes: summary.topDevices,
  };
}

export async function fetchGeographyData(siteId: string, filter?: GlobalFilterState) {
  const summary = await AnalyticsService.getAnalyticsSummary(siteId, '30d', filter);
  return summary.topCountries.map(c => ({
    country: c.name,
    code: c.code || 'XX',
    flag: c.code || '🌐',
    visitors: c.count,
    sessions: c.count,
    pageViews: c.count,
    bounceRate: 0,
    avgDuration: summary.avgSessionDuration,
    avgDurationFormatted: `${Math.floor(summary.avgSessionDuration / 60)}m ${summary.avgSessionDuration % 60}s`,
    topPages: summary.topPages.map(p => ({ url: p.name, title: p.name, views: p.count })),
  }));
}

export async function fetchIntegrationStatus(siteId: string) {
  return AnalyticsService.getIntegrationStatus(siteId);
}
