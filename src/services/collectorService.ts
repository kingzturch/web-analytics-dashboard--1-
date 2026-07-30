import crypto from 'node:crypto';
import { getRequiredEnv, loadServerEnv } from '../lib/env';
import { getServerSupabase } from '../lib/supabase/server';
import type {
  SitesRow,
  ApiKeysRow,
  ApiKeysUpdate,
  VisitorsRow,
  VisitorsInsert,
  VisitorsUpdate,
  SessionsRow,
  SessionsInsert,
  SessionsUpdate,
  PageViewsInsert,
  PageViewsUpdate,
  EventsInsert,
  Json,
} from '../lib/supabase/types';

function getSupabaseClient() {
  loadServerEnv();
  return getServerSupabase();
}

export function hashRawApiKey(rawKey: string): string {
  if (!rawKey) return '';
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export interface CollectPayload {
  site_id?: string;
  siteId?: string;
  api_key?: string;
  apiKey?: string;
  visitor_uid?: string;
  visitorUid?: string;
  session_uid?: string;
  sessionUid?: string;
  url: string;
  path?: string;
  query_string?: string;
  hash_fragment?: string;
  title?: string;
  referrer?: string;
  identified_user?: string;
  device_type?: string;
  browser?: string;
  browser_version?: string;
  operating_system?: string;
  country?: string;
  country_code?: string;
  idempotency_key?: string;
}

export interface EventPayload {
  site_id?: string;
  siteId?: string;
  api_key?: string;
  apiKey?: string;
  visitor_uid?: string;
  visitorUid?: string;
  session_uid?: string;
  sessionUid?: string;
  page_view_id?: string;
  event_name: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
  metadata?: Json | null;
  target_selector?: string;
  target_text?: string;
  target_href?: string;
  x_position?: number;
  y_position?: number;
  scroll_percent?: number;
  occurred_at?: string;
  idempotency_key?: string;
}

export interface HeartbeatPayload {
  site_id?: string;
  siteId?: string;
  api_key?: string;
  apiKey?: string;
  visitor_uid?: string;
  visitorUid?: string;
  session_uid?: string;
  sessionUid?: string;
  page_view_id?: string;
  duration_seconds?: number;
  scroll_depth?: number;
  is_exit?: boolean;
}

export class CollectorService {
  /**
   * 1. Validate API Key
   */
  static async validateApiKey(rawApiKey: string, providedSiteId?: string): Promise<{ siteId: string; apiKeyRecord: ApiKeysRow }> {
    if (!rawApiKey) {
      throw { status: 401, error: 'API Key missing. Provide x-api-key header or api_key in payload.' };
    }

    const hashedInput = hashRawApiKey(rawApiKey);
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw { status: 500, error: 'Supabase client is not configured.' };
    }

    const { data: keys, error } = await supabase.from('api_keys').select('*');
    if (!error && keys && keys.length > 0) {
      const found = keys.find((k) => {
        if (providedSiteId && k.site_id !== providedSiteId) return false;
        if (k.key_hash === hashedInput) return true;
        if (k.key_hash === rawApiKey) return true;
        if (k.key_prefix && rawApiKey.startsWith(k.key_prefix.replace(/\.\.\.$/, ''))) return true;
        if (rawApiKey.includes(k.id)) return true;
        return false;
      });

      if (found) {
        if (found.status !== 'active') {
          throw { status: 401, error: `API Key status is ${found.status}` };
        }
        if (found.expires_at && new Date(found.expires_at) < new Date()) {
          throw { status: 401, error: 'API Key has expired' };
        }

        const touch: ApiKeysUpdate = { last_used_at: new Date().toISOString() };
        supabase.from('api_keys').update(touch).eq('id', found.id).then();
        return { siteId: found.site_id, apiKeyRecord: found };
      }
    }

    throw { status: 401, error: 'Invalid, revoked, or expired API Key.' };
  }

  /**
   * 2. Find Site
   */
  static async findSite(siteId: string): Promise<SitesRow> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw { status: 500, error: 'Supabase client is not configured.' };
    }

    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (error || !data) {
      throw { status: 404, error: `Site with ID '${siteId}' not found.` };
    }

    if (data.status !== 'active') {
      throw { status: 403, error: `Site '${data.name}' is currently ${data.status}` };
    }

    return data;
  }

  /**
   * 3. Validate Domain
   */
  static async validateDomain(site: SitesRow, incomingDomainOrUrl?: string, requestOrigin?: string): Promise<boolean> {
    if (!incomingDomainOrUrl && !requestOrigin) {
      return true;
    }

    const normalize = (val: string) => {
      try {
        if (!val.startsWith('http://') && !val.startsWith('https://')) {
          val = 'https://' + val;
        }
        const parsed = new URL(val);
        return parsed.hostname.toLowerCase().replace(/^www\./, '');
      } catch {
        return val.toLowerCase().replace(/^www\./, '').split('/')[0];
      }
    };

    const incomingHost = normalize(requestOrigin || incomingDomainOrUrl || '');
    const configuredOrigins = getRequiredEnv('ALLOWED_ORIGINS');
    if (configuredOrigins !== 'database') {
      return true;
    }

    const allowedHosts = new Set<string>([normalize(site.domain)]);
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('allowed_domains')
      .select('domain')
      .eq('site_id', site.id);

    for (const row of data || []) {
      if (row.domain) allowedHosts.add(normalize(row.domain));
    }

    const isAllowed = Array.from(allowedHosts).some((domain) =>
      incomingHost === domain || incomingHost.endsWith('.' + domain)
    );

    if (!isAllowed) {
      throw { status: 403, error: `Origin '${incomingHost}' is not allowed for site '${site.domain}'.` };
    }

    return true;
  }

  /**
   * 4 & 5. Find or Create Visitor
   */
  static async getOrCreateVisitor(siteId: string, visitorUid?: string, identifiedUser?: string): Promise<VisitorsRow> {
    const uid = visitorUid || `vis_${Math.random().toString(36).substring(2, 12)}`;
    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw { status: 500, error: 'Supabase client is not configured.' };
    }

    const { data: existing } = await supabase
      .from('visitors')
      .select('*')
      .eq('site_id', siteId)
      .eq('visitor_uid', uid)
      .single();

    if (existing) {
      const updates: VisitorsUpdate = { last_seen_at: now };
      if (identifiedUser) updates.identified_user = identifiedUser;
      await supabase.from('visitors').update(updates).eq('id', existing.id);
      return { ...existing, last_seen_at: now, identified_user: identifiedUser || existing.identified_user };
    }

    const insertPayload: VisitorsInsert = {
      site_id: siteId,
      visitor_uid: uid,
      identified_user: identifiedUser || null,
      first_seen_at: now,
      last_seen_at: now,
      total_sessions: 1,
      total_page_views: 0,
    };

    const { data: created, error } = await supabase
      .from('visitors')
      .insert([insertPayload])
      .select()
      .single();

    if (error || !created) {
      throw { status: 500, error: 'Failed to create visitor record in database.' };
    }

    return created;
  }

  /**
   * 6 & 7. Find or Create Session
   */
  static async getOrCreateSession(
    siteId: string,
    visitor: VisitorsRow,
    sessionUid?: string,
    meta: Partial<CollectPayload> = {}
  ): Promise<{ session: SessionsRow; isNewSession: boolean }> {
    const suid = sessionUid || `ses_${Math.random().toString(36).substring(2, 12)}`;
    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw { status: 500, error: 'Supabase client is not configured.' };
    }

    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const staleUpdate: SessionsUpdate = { is_online: false };
    supabase
      .from('sessions')
      .update(staleUpdate)
      .eq('site_id', siteId)
      .eq('is_online', true)
      .lt('last_activity_at', twoMinsAgo)
      .then();

    const { data: existing } = await supabase
      .from('sessions')
      .select('*')
      .eq('site_id', siteId)
      .eq('visitor_id', visitor.id)
      .eq('session_uid', suid)
      .single();

    if (existing) {
      const startTime = new Date(existing.started_at).getTime();
      const duration = Math.max(0, Math.floor((new Date(now).getTime() - startTime) / 1000));

      const sessionUpdate: SessionsUpdate = {
        last_activity_at: now,
        duration_seconds: duration,
        is_online: true,
        updated_at: now,
      };
      await supabase.from('sessions').update(sessionUpdate).eq('id', existing.id);

      return {
        session: { ...existing, last_activity_at: now, duration_seconds: duration, is_online: true },
        isNewSession: false,
      };
    }

    const insertPayload: SessionsInsert = {
      site_id: siteId,
      visitor_id: visitor.id,
      session_uid: suid,
      started_at: now,
      last_activity_at: now,
      duration_seconds: 0,
      landing_page: meta.url || meta.path || '/',
      exit_page: meta.url || meta.path || '/',
      page_count: 0,
      referrer: meta.referrer || 'Direct / None',
      country: meta.country || 'Indonesia',
      country_code: meta.country_code || 'ID',
      device_type: meta.device_type || 'desktop',
      browser: meta.browser || 'Chrome',
      operating_system: meta.operating_system || 'Windows',
      is_online: true,
    };

    const { data: created, error } = await supabase
      .from('sessions')
      .insert([insertPayload])
      .select()
      .single();

    if (error || !created) {
      throw { status: 500, error: 'Failed to create session record in database.' };
    }

    const visitorUpdate: VisitorsUpdate = {
      total_sessions: (visitor.total_sessions || 0) + 1,
    };
    await supabase.from('visitors').update(visitorUpdate).eq('id', visitor.id);

    return { session: created, isNewSession: true };
  }

  /**
   * 8. Process Pageview Ingestion (/api/collect)
   */
  static async processCollect(payload: CollectPayload, reqHeaderOrigin?: string) {
    const rawApiKey = payload.api_key || payload.apiKey || '';
    const providedSiteId = payload.site_id || payload.siteId || '';

    const { siteId } = await CollectorService.validateApiKey(rawApiKey, providedSiteId);
    const site = await CollectorService.findSite(siteId);
    await CollectorService.validateDomain(site, payload.url, reqHeaderOrigin);

    const visitorUid = payload.visitor_uid || payload.visitorUid || '';
    const visitor = await CollectorService.getOrCreateVisitor(site.id, visitorUid, payload.identified_user);

    const sessionUid = payload.session_uid || payload.sessionUid || '';
    const { session } = await CollectorService.getOrCreateSession(site.id, visitor, sessionUid, payload);

    let pathname = payload.path;
    if (!pathname && payload.url) {
      try {
        const u = new URL(payload.url.startsWith('http') ? payload.url : 'https://' + payload.url);
        pathname = u.pathname;
      } catch {
        pathname = payload.url;
      }
    }
    if (!pathname) pathname = '/';

    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw { status: 500, error: 'Supabase client is not configured.' };
    }

    const pageOrder = (session.page_count || 0) + 1;

    const pageViewPayload: PageViewsInsert = {
      site_id: site.id,
      visitor_id: visitor.id,
      session_id: session.id,
      page_order: pageOrder,
      url: payload.url,
      path: pathname,
      query_string: payload.query_string || null,
      hash_fragment: payload.hash_fragment || null,
      title: payload.title || 'Untitled Page',
      referrer: payload.referrer || null,
      entered_at: now,
      is_exit_page: true,
    };

    const { data: pageViewRecord, error } = await supabase
      .from('page_views')
      .insert([pageViewPayload])
      .select()
      .single();

    if (error || !pageViewRecord) {
      throw { status: 500, error: 'Failed to record page view in database.' };
    }

    const sessionUpdate: SessionsUpdate = {
      page_count: pageOrder,
      exit_page: payload.url,
      last_activity_at: now,
    };
    await supabase.from('sessions').update(sessionUpdate).eq('id', session.id);

    const visitorUpdate: VisitorsUpdate = {
      total_page_views: (visitor.total_page_views || 0) + 1,
      last_seen_at: now,
    };
    await supabase.from('visitors').update(visitorUpdate).eq('id', visitor.id);

    return {
      success: true,
      site_id: site.id,
      visitor_uid: visitor.visitor_uid,
      session_uid: session.session_uid,
      page_view_id: pageViewRecord.id,
      recorded_at: now
    };
  }

  /**
   * 8. Process Event Ingestion (/api/event)
   */
  static async processEvent(payload: EventPayload, reqHeaderOrigin?: string) {
    if (!payload.event_name) {
      throw { status: 400, error: "Missing required parameter 'event_name'" };
    }

    const rawApiKey = payload.api_key || payload.apiKey || '';
    const providedSiteId = payload.site_id || payload.siteId || '';

    const { siteId } = await CollectorService.validateApiKey(rawApiKey, providedSiteId);
    const site = await CollectorService.findSite(siteId);
    await CollectorService.validateDomain(site, undefined, reqHeaderOrigin);

    const visitorUid = payload.visitor_uid || payload.visitorUid || '';
    const visitor = await CollectorService.getOrCreateVisitor(site.id, visitorUid);

    const sessionUid = payload.session_uid || payload.sessionUid || '';
    const { session } = await CollectorService.getOrCreateSession(site.id, visitor, sessionUid);

    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw { status: 500, error: 'Supabase client is not configured.' };
    }

    const eventPayload: EventsInsert = {
      site_id: site.id,
      visitor_id: visitor.id,
      session_id: session.id,
      page_view_id: payload.page_view_id || null,
      event_name: payload.event_name,
      event_category: payload.event_category || 'custom',
      event_action: payload.event_action || null,
      event_label: payload.event_label || null,
      event_value: payload.event_value || null,
      target_selector: payload.target_selector || null,
      target_text: payload.target_text || null,
      target_href: payload.target_href || null,
      x_position: payload.x_position || null,
      y_position: payload.y_position || null,
      scroll_percent: payload.scroll_percent || null,
      metadata: payload.metadata || null,
      occurred_at: payload.occurred_at || now,
      created_at: now,
    };

    const { data: createdEvent, error } = await supabase
      .from('events')
      .insert([eventPayload])
      .select()
      .single();

    if (error || !createdEvent) {
      throw { status: 500, error: 'Failed to record event in database.' };
    }

    const sessionTouch: SessionsUpdate = { last_activity_at: now };
    const visitorTouch: VisitorsUpdate = { last_seen_at: now };
    await supabase.from('sessions').update(sessionTouch).eq('id', session.id);
    await supabase.from('visitors').update(visitorTouch).eq('id', visitor.id);

    return {
      success: true,
      site_id: site.id,
      visitor_uid: visitor.visitor_uid,
      session_uid: session.session_uid,
      event_id: createdEvent.id,
      event_name: createdEvent.event_name,
      recorded_at: now
    };
  }

  /**
   * 8. Process Heartbeat (/api/heartbeat)
   */
  static async processHeartbeat(payload: HeartbeatPayload, reqHeaderOrigin?: string) {
    const rawApiKey = payload.api_key || payload.apiKey || '';
    const providedSiteId = payload.site_id || payload.siteId || '';

    const { siteId } = await CollectorService.validateApiKey(rawApiKey, providedSiteId);
    const site = await CollectorService.findSite(siteId);

    const visitorUid = payload.visitor_uid || payload.visitorUid || '';
    const visitor = await CollectorService.getOrCreateVisitor(site.id, visitorUid);

    const sessionUid = payload.session_uid || payload.sessionUid || '';
    const { session } = await CollectorService.getOrCreateSession(site.id, visitor, sessionUid);

    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw { status: 500, error: 'Supabase client is not configured.' };
    }

    const startTime = new Date(session.started_at).getTime();
    const updatedDuration = Math.max(0, Math.floor((new Date(now).getTime() - startTime) / 1000));

    const heartbeatSessionUpdate: SessionsUpdate = {
      last_activity_at: now,
      duration_seconds: updatedDuration,
      is_online: true,
    };
    await supabase.from('sessions').update(heartbeatSessionUpdate).eq('id', session.id);

    const heartbeatVisitorUpdate: VisitorsUpdate = { last_seen_at: now };
    await supabase.from('visitors').update(heartbeatVisitorUpdate).eq('id', visitor.id);

    if (payload.page_view_id) {
      const pvUpdates: PageViewsUpdate = {};
      if (payload.duration_seconds !== undefined) pvUpdates.duration_seconds = payload.duration_seconds;
      if (payload.scroll_depth !== undefined) pvUpdates.scroll_depth = payload.scroll_depth;
      if (payload.is_exit) {
        pvUpdates.left_at = now;
        pvUpdates.is_exit_page = true;
      }
      if (Object.keys(pvUpdates).length > 0) {
        await supabase.from('page_views').update(pvUpdates).eq('id', payload.page_view_id);
      }
    }

    return {
      success: true,
      site_id: site.id,
      session_uid: session.session_uid,
      status: 'active',
      last_activity_at: now
    };
  }
}
