import { getBrowserSupabase, getServerSupabase, validateSupabaseEnv, testSupabaseConnection } from './supabase/index';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase/types';

export const supabase: SupabaseClient<Database> | null = typeof window === 'undefined' ? getServerSupabase() : getBrowserSupabase();

export const isSupabaseConfigured = (): boolean => {
  const env = validateSupabaseEnv();
  return env.hasUrl && (env.hasAnonKey || env.hasServiceRoleKey);
};

export { validateSupabaseEnv, testSupabaseConnection };
export * from './supabase/types';
