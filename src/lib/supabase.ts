import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Bindings } from '../types';

/**
 * Creates and returns a lightweight Supabase client using REST API.
 * Configured specifically for stateless Edge environments (Cloudflare Workers).
 */
export function getSupabaseClient(env: Bindings): SupabaseClient {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-client-info': 'dynamic-review-card-engine-v2',
      },
    },
  });
}
