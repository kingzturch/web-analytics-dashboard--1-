import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  VisitorsRow,
  SessionsRow,
  PageViewsRow,
  EventsRow,
  AllowedDomainsRow,
} from '../lib/supabase/types';
import type { GlobalFilterState } from '../types/analytics';

export type VisitorWithSessions = VisitorsRow & {
  sessions: SessionsRow[];
};

export type VisitorDetailRow = VisitorsRow & {
  sessions: (SessionsRow & {
    page_views: PageViewsRow[];
    events: EventsRow[];
  })[];
};

export type SessionDetailRow = SessionsRow & {
  page_views: PageViewsRow[];
  events: EventsRow[];
  visitors: VisitorsRow | null;
};

export type OnlineSessionRow = SessionsRow & {
  page_views: PageViewsRow[];
  visitors: VisitorsRow | null;
};

export class AnalyticsRepository {
  static async getVisitors(
    siteId: string,
    page: number = 1,
    pageSize: number = 10,
    search: string = ''
  ): Promise<{ visitors: VisitorWithSessions[]; total: number; page: number; totalPages: number }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { visitors: [], total: 0, page, totalPages: 1 };
    }

    let query = supabase
      .from('visitors')
      .select('*, sessions(*)', { count: 'exact' })
      .eq('site_id', siteId);

    if (search && search.trim() !== '') {
      query = query.or(`visitor_uid.ilike.%${search.trim()}%,identified_user.ilike.%${search.trim()}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('last_seen_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(`Error fetching visitors for site ${siteId}:`, error);
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      visitors: data ?? [],
      total,
      page,
      totalPages,
    };
  }

  static async getVisitorById(siteId: string, visitorId: string): Promise<VisitorDetailRow | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('visitors')
      .select('*, sessions(*, page_views(*), events(*))')
      .eq('site_id', siteId)
      .eq('id', visitorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error(`Error fetching visitor detail ${visitorId}:`, error);
      throw error;
    }

    return data;
  }

  static async getSessions(
    siteId: string,
    startDate?: string,
    endDate?: string,
    filter?: GlobalFilterState
  ): Promise<SessionsRow[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    let query = supabase.from('sessions').select('*').eq('site_id', siteId);

    if (startDate) {
      query = query.gte('started_at', startDate);
    }
    if (endDate) {
      query = query.lte('started_at', endDate);
    }

    if (filter) {
      if (filter.country) query = query.eq('country_code', filter.country.toUpperCase());
      if (filter.browser) query = query.ilike('browser', `%${filter.browser}%`);
      if (filter.os) query = query.ilike('operating_system', `%${filter.os}%`);
      if (filter.device) query = query.eq('device_type', filter.device);
      if (filter.referrer) query = query.ilike('referrer', `%${filter.referrer}%`);
    }

    const { data, error } = await query.order('started_at', { ascending: false });

    if (error) {
      console.error(`Error fetching sessions for site ${siteId}:`, error);
      throw error;
    }

    return data ?? [];
  }

  static async getSessionById(siteId: string, sessionId: string): Promise<SessionDetailRow | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*, page_views(*), events(*), visitors(*)')
      .eq('site_id', siteId)
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error(`Error fetching session ${sessionId}:`, error);
      throw error;
    }

    return data;
  }

  static async getPageViews(
    siteId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PageViewsRow[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    let query = supabase.from('page_views').select('*').eq('site_id', siteId);

    if (startDate) {
      query = query.gte('entered_at', startDate);
    }
    if (endDate) {
      query = query.lte('entered_at', endDate);
    }

    const { data, error } = await query.order('entered_at', { ascending: false });

    if (error) {
      console.error(`Error fetching page views for site ${siteId}:`, error);
      throw error;
    }

    return data ?? [];
  }

  static async getEvents(
    siteId: string,
    startDate?: string,
    endDate?: string,
    category?: string,
    eventName?: string
  ): Promise<EventsRow[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    let query = supabase.from('events').select('*').eq('site_id', siteId);

    if (startDate) {
      query = query.gte('occurred_at', startDate);
    }
    if (endDate) {
      query = query.lte('occurred_at', endDate);
    }
    if (category) {
      query = query.eq('event_category', category);
    }
    if (eventName) {
      query = query.eq('event_name', eventName);
    }

    const { data, error } = await query.order('occurred_at', { ascending: false });

    if (error) {
      console.error(`Error fetching events for site ${siteId}:`, error);
      throw error;
    }

    return data ?? [];
  }

  static async getOnlineSessions(siteId: string): Promise<OnlineSessionRow[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('sessions')
      .select('*, page_views(*), visitors(*)')
      .eq('site_id', siteId)
      .or(`is_online.eq.true,last_activity_at.gte.${fiveMinsAgo}`);

    if (error) {
      console.error(`Error fetching online sessions for site ${siteId}:`, error);
      throw error;
    }

    return data ?? [];
  }

  static async getAllowedDomains(siteId: string): Promise<AllowedDomainsRow[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('allowed_domains')
      .select('*')
      .eq('site_id', siteId);

    if (error) {
      console.error(`Error fetching allowed domains for site ${siteId}:`, error);
      throw error;
    }

    return data ?? [];
  }
}
