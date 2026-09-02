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
 * Structure of data stored in Cloudflare KV cache
 * Used for both `card:{short_code}` and `nfc:{nfc_uid}` keys
 */
export interface CachedCardData {
  id?: string;          // card UUID in database
  target_url: string | null; // Destination URL
  is_active?: boolean;  // Card active status
  short_code?: string;  // Short identifier (QR)
  nfc_uid?: string;     // NFC chip hardware UID [v3]
}

/**
 * Access type for tap log entries [v3]
 */
export type AccessType = 'QR' | 'NFC';

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
  nfc_uid: string | null;   // NFC chip hardware UID [v3]
  label: string | null;     // Internal admin label [NEW]
  user_id: string | null;
  target_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DeviceType = 'Android' | 'iOS' | 'Desktop' | 'Other';

export interface TapLog {
  id?: number;
  card_id: string;
  access_type: AccessType;  // 'QR' or 'NFC' [v3]
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
  target_url?: string | null;
  nfc_uid?: string | null;   // [v3]
  label?: string | null;     // [NEW]
  user_id?: string | null;
  is_active?: boolean;
}

export interface GenerateCardsInput {
  count?: number;
  label?: string | null;     // [NEW]
}

export interface UpdateCardInput {
  target_url?: string | null;
  is_active?: boolean;
  short_code?: string;
  nfc_uid?: string | null;   // [v3]
  label?: string | null;     // [NEW]
  user_id?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
