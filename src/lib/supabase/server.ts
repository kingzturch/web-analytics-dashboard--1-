import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import type { Database } from './types';
import { getRequiredEnv, loadServerEnv } from '../env';

let serverClient: SupabaseClient<Database> | null = null;

export function getServerSupabase(): SupabaseClient<Database> | null {
  if (serverClient) return serverClient;

  loadServerEnv();
  const url = getRequiredEnv('SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  serverClient = createClient<Database>(url, serviceRoleKey, {
    realtime: {
      transport: WebSocket as unknown as typeof globalThis.WebSocket,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClient;
}

export function validateSupabaseEnv() {
  loadServerEnv();

  const url = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const errors: string[] = [];

  if (!url) errors.push('SUPABASE_URL is missing.');
  if (!serviceRoleKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is missing.');

  return {
    isValid: errors.length === 0,
    hasUrl: !!url,
    hasServiceRoleKey: !!serviceRoleKey,
    errors,
  };
}

export async function testSupabaseConnection(): Promise<{ success: boolean; siteCount: number; message: string }> {
  try {
    const client = getServerSupabase();
    if (!client) {
      return { success: false, siteCount: 0, message: 'Supabase client could not be initialized.' };
    }

    const { data, error } = await client
      .from('sites')
      .select('id, name, domain, status', { count: 'exact' });

    if (error) {
      return { success: false, siteCount: 0, message: `Database Query Error: ${error.message}` };
    }

    return {
      success: true,
      siteCount: data?.length || 0,
      message: `Connection Successful! Found ${data?.length || 0} active site(s) in Supabase.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, siteCount: 0, message: `Runtime Exception: ${message}` };
  }
}
