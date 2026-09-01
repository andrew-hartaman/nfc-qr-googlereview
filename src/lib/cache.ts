import type { KVNamespace } from '@cloudflare/workers-types';
import type { CachedCardData } from '../types';

const DEFAULT_CACHE_TTL_SECONDS = 3600; // 1 hour TTL

/**
 * Generates the standardized cache key for a card
 */
export function getCardCacheKey(shortCode: string): string {
  return `card:${shortCode.trim().toLowerCase()}`;
}

/**
 * Retrieves cached card metadata from Cloudflare KV.
 * Handles both JSON structure (`{ id, target_url, is_active }`) and legacy raw string URL fallback.
 */
export async function getCardCache(
  kv: KVNamespace,
  shortCode: string
): Promise<CachedCardData | null> {
  try {
    const key = getCardCacheKey(shortCode);
    let rawValue = await kv.get(key);

    // Fallback check for legacy key `card_url:${shortCode}`
    if (!rawValue) {
      rawValue = await kv.get(`card_url:${shortCode.trim().toLowerCase()}`);
    }

    if (!rawValue) {
      return null;
    }

    // Try parsing as JSON
    try {
      const parsed = JSON.parse(rawValue);
      if (parsed && typeof parsed.target_url === 'string') {
        // If card is explicitly marked as inactive in cache, treat as cache miss
        if (parsed.is_active === false) {
          return null;
        }

        return {
          id: parsed.id || '',
          target_url: parsed.target_url,
          is_active: parsed.is_active ?? true,
          short_code: parsed.short_code || shortCode,
        };
      }
    } catch {
      // If rawValue is a plain URL string
      return {
        id: '',
        target_url: rawValue,
        is_active: true,
        short_code: shortCode,
      };
    }

    return null;
  } catch (error) {
    console.error(`[KV Cache Get Error] Failed to read key for short_code: ${shortCode}`, error);
    return null;
  }
}

/**
 * Stores card metadata in Cloudflare KV with TTL.
 *
 * @param kv KVNamespace binding
 * @param shortCode Card's short identifier
 * @param data CachedCardData containing id, target_url, and is_active
 * @param ttlSeconds Time-to-live in seconds (default 3600 = 1 hour)
 */
export async function setCardCache(
  kv: KVNamespace,
  shortCode: string,
  data: CachedCardData,
  ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS
): Promise<boolean> {
  try {
    const key = getCardCacheKey(shortCode);
    const value = JSON.stringify({
      id: data.id || '',
      short_code: data.short_code || shortCode.trim().toLowerCase(),
      target_url: data.target_url,
      is_active: data.is_active ?? true,
    });
    await kv.put(key, value, { expirationTtl: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`[KV Cache Set Error] Failed to write key for short_code: ${shortCode}`, error);
    return false;
  }
}

/**
 * Invalidates (deletes) the cached card from Cloudflare KV.
 */
export async function deleteCardCache(
  kv: KVNamespace,
  shortCode: string
): Promise<boolean> {
  try {
    const key = getCardCacheKey(shortCode);
    const legacyKey = `card_url:${shortCode.trim().toLowerCase()}`;
    await Promise.all([
      kv.delete(key),
      kv.delete(legacyKey),
    ]);
    return true;
  } catch (error) {
    console.error(`[KV Cache Delete Error] Failed to delete key for short_code: ${shortCode}`, error);
    return false;
  }
}
