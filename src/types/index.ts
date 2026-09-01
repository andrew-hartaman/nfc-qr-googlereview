import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * Cloudflare Worker Environment Bindings
 */
export interface Bindings {
  CARD_CACHE: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DEFAULT_FALLBACK_URL?: string;
  ADMIN_API_KEY?: string;
}

/**
 * Structure of data stored in Cloudflare KV cache for key `card:{short_code}`
 */
export interface CachedCardData {
  id?: string; // card UUID in database
  target_url: string; // Destination URL
  is_active?: boolean; // Card active status
  short_code?: string; // Short identifier
}


/**
 * Database Models
 */
export interface User {
  id: string;
  name: string;
  email: string;
  business_name: string;
  created_at: string;
}

export interface Card {
  id: string;
  short_code: string;
  user_id: string | null;
  target_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DeviceType = 'Android' | 'iOS' | 'Desktop' | 'Other';

export interface TapLog {
  id?: number;
  card_id: string;
  device_type: DeviceType;
  user_agent: string | null;
  ip_address: string | null;
  tapped_at?: string;
}

/**
 * API Request & Response Types
 */
export interface CreateCardInput {
  short_code: string;
  target_url: string;
  user_id?: string | null;
  is_active?: boolean;
}

export interface UpdateCardInput {
  target_url?: string;
  is_active?: boolean;
  short_code?: string;
  user_id?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
