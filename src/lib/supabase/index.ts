import { getBrowserSupabase } from './browser';
import { getServerSupabase } from './server';
import { loadServerEnv } from '../env';

export * from './types';
export { getBrowserSupabase } from './browser';
export { getServerSupabase } from './server';

export interface SupabaseEnvStatus {
  isValid: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  errors: string[];
}

export function validateSupabaseEnv(): SupabaseEnvStatus {
  if (typeof window === 'undefined') {
    loadServerEnv();
  }

  const url = typeof window === 'undefined'
    ? process.env.SUPABASE_URL || ''
    : import.meta.env?.VITE_SUPABASE_URL || '';

  const anonKey = typeof window === 'undefined'
    ? ''
    : import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

  const serviceRoleKey = typeof window === 'undefined'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    : '';

  const errors: string[] = [];
  if (!url) errors.push(typeof window === 'undefined' ? 'SUPABASE_URL is missing.' : 'VITE_SUPABASE_URL is missing.');
  if (typeof window !== 'undefined' && !anonKey) errors.push('VITE_SUPABASE_ANON_KEY is missing.');
  if (typeof window === 'undefined' && !serviceRoleKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is missing.');

  return {
    isValid: errors.length === 0,
    hasUrl: !!url,
    hasAnonKey: !!anonKey,
    hasServiceRoleKey: !!serviceRoleKey,
    errors,
  };
}

export async function testSupabaseConnection(): Promise<{ success: boolean; siteCount: number; message: string }> {
  try {
    const client = typeof window === 'undefined' ? getServerSupabase() : getBrowserSupabase();
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
  } catch (err: any) {
    return { success: false, siteCount: 0, message: `Runtime Exception: ${err.message || String(err)}` };
  }
}
