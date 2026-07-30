import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let browserClient: SupabaseClient<Database> | null = null;

export function getBrowserSupabase(): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (browserClient) return browserClient;

  const url = import.meta.env?.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    console.warn('[Supabase Browser Client] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing.');
    return null;
  }

  browserClient = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return browserClient;
}
