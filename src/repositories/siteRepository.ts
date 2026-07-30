import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  SitesRow,
  SitesInsert,
  SitesUpdate,
  ApiKeysRow,
  ApiKeysInsert,
  ApiKeysUpdate,
} from '../lib/supabase/types';

export class SiteRepository {
  static async getAllSites(): Promise<SitesRow[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sites from Supabase:', error);
      throw error;
    }

    return data ?? [];
  }

  static async getSiteById(siteId: string): Promise<SitesRow | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error(`Error fetching site ${siteId}:`, error);
      throw error;
    }

    return data;
  }

  static async createSite(
    name: string,
    domain: string,
    description?: string,
    timezone?: string
  ): Promise<SitesRow> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client is not configured');
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload: SitesInsert = {
      name,
      slug,
      domain: cleanDomain,
      description: description || null,
      timezone: timezone || 'UTC',
      status: 'active',
    };

    const { data, error } = await supabase
      .from('sites')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating site in Supabase:', error);
      throw error;
    }

    return data;
  }

  static async updateSite(siteId: string, updates: SitesUpdate): Promise<SitesRow> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client is not configured');
    }

    const dbUpdates: SitesUpdate = {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.slug !== undefined ? { slug: updates.slug } : {}),
      ...(updates.domain !== undefined ? { domain: updates.domain } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.timezone !== undefined ? { timezone: updates.timezone } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sites')
      .update(dbUpdates)
      .eq('id', siteId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating site ${siteId}:`, error);
      throw error;
    }

    return data;
  }

  static async deleteSite(siteId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client is not configured');
    }

    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);

    if (error) {
      console.error(`Error deleting site ${siteId}:`, error);
      throw error;
    }

    return true;
  }

  static async getApiKeys(siteId: string): Promise<ApiKeysRow[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching API keys for site ${siteId}:`, error);
      throw error;
    }

    return (data ?? []).map((k) => ({
      ...k,
      key_prefix: k.key_prefix || `pa_live_${k.id.substring(0, 8)}...`,
    }));
  }

  static async createApiKey(
    siteId: string,
    name: string,
    keyHash: string,
    keyPrefix: string,
    expiresAt?: string | null
  ): Promise<ApiKeysRow> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client is not configured');
    }

    const payload: ApiKeysInsert = {
      site_id: siteId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      status: 'active',
      expires_at: expiresAt || null,
    };

    const { data, error } = await supabase
      .from('api_keys')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating API key in Supabase:', error);
      throw error;
    }

    return {
      ...data,
      key_prefix: keyPrefix,
    };
  }

  static async revokeApiKey(keyId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client is not configured');
    }

    const payload: ApiKeysUpdate = {
      status: 'revoked',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('api_keys')
      .update(payload)
      .eq('id', keyId);

    if (error) {
      console.error(`Error revoking API key ${keyId}:`, error);
      throw error;
    }

    return true;
  }

  static async regenerateApiKey(
    keyId: string,
    newKeyHash: string,
    newKeyPrefix: string
  ): Promise<ApiKeysRow> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client is not configured');
    }

    const payload: ApiKeysUpdate = {
      key_hash: newKeyHash,
      key_prefix: newKeyPrefix,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('api_keys')
      .update(payload)
      .eq('id', keyId)
      .select()
      .single();

    if (error) {
      console.error(`Error regenerating API key ${keyId}:`, error);
      throw error;
    }

    return {
      ...data,
      key_prefix: newKeyPrefix,
    };
  }
}
