import type { KVNamespace } from '@cloudflare/workers-types';
import type { CachedCardData } from '../types';

const DEFAULT_CACHE_TTL_SECONDS = 3600; // 1 hour TTL

// ── Key Generators ──────────────────────────────────────────────────

/**
 * Generates the standardized cache key for a card by short_code
 */
export function getCardCacheKey(shortCode: string): string {
  return `card:${shortCode.trim().toLowerCase()}`;
}

/**
 * Generates the cache key for a card by NFC UID [v3]
 */
export function getNfcCacheKey(nfcUid: string): string {
  return `nfc:${nfcUid.trim().toUpperCase()}`;
}

// ── Cache Reads ─────────────────────────────────────────────────────

/**
 * Retrieves cached card metadata from Cloudflare KV by short_code.
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

    return parseCachedValue(rawValue, shortCode);
  } catch (error) {
    console.error(`[KV Cache Get Error] Failed to read key for short_code: ${shortCode}`, error);
    return null;
  }
}

/**
 * Retrieves cached card metadata from Cloudflare KV by NFC UID [v3].
 */
export async function getCardCacheByNfc(
  kv: KVNamespace,
  nfcUid: string
): Promise<CachedCardData | null> {
  try {
    const key = getNfcCacheKey(nfcUid);
    const rawValue = await kv.get(key);

    if (!rawValue) {
      return null;
    }

    return parseCachedValue(rawValue);
  } catch (error) {
    console.error(`[KV Cache Get Error] Failed to read key for nfc_uid: ${nfcUid}`, error);
    return null;
  }
}

/**
 * Parse raw KV value into CachedCardData
 */
function parseCachedValue(rawValue: string, fallbackShortCode?: string): CachedCardData | null {
  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === 'object') {
      // If card is explicitly marked as inactive in cache, treat as cache miss
      if (parsed.is_active === false) {
        return null;
      }

      return {
        id: parsed.id || '',
        target_url: parsed.target_url || null,
        is_active: parsed.is_active ?? false,
        short_code: parsed.short_code || fallbackShortCode || '',
        nfc_uid: parsed.nfc_uid || undefined,
      };
    }
  } catch {
    // If rawValue is a plain URL string (legacy)
    return {
      id: '',
      target_url: rawValue,
      is_active: false,
      short_code: fallbackShortCode || '',
    };
  }

  return null;
}

// ── Cache Writes ────────────────────────────────────────────────────

/**
 * Stores card metadata in Cloudflare KV under `card:{short_code}` key.
 * If data contains nfc_uid, also writes under `nfc:{nfc_uid}` key.
 */
export async function setCardCache(
  kv: KVNamespace,
  shortCode: string,
  data: CachedCardData,
  ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS
): Promise<boolean> {
  try {
    const value = JSON.stringify({
      id: data.id || '',
      short_code: data.short_code || shortCode.trim().toLowerCase(),
      nfc_uid: data.nfc_uid || undefined,
      target_url: data.target_url || null,
      is_active: data.is_active ?? false,
    });

    const opts = { expirationTtl: ttlSeconds };

    // Write primary key card:{short_code}
    const key = getCardCacheKey(shortCode);
    await kv.put(key, value, opts);

    // Also write NFC key if present [v3]
    if (data.nfc_uid) {
      const nfcKey = getNfcCacheKey(data.nfc_uid);
      await kv.put(nfcKey, value, opts);
    }

    return true;
  } catch (error) {
    console.error(`[KV Cache Set Error] Failed to write key for short_code: ${shortCode}`, error);
    return false;
  }
}

/**
 * Stores card metadata in Cloudflare KV under `nfc:{nfc_uid}` key only [v3].
 */
export async function setNfcCache(
  kv: KVNamespace,
  nfcUid: string,
  data: CachedCardData,
  ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS
): Promise<boolean> {
  try {
    const key = getNfcCacheKey(nfcUid);
    const value = JSON.stringify({
      id: data.id || '',
      short_code: data.short_code || '',
      nfc_uid: data.nfc_uid || nfcUid.trim().toUpperCase(),
      target_url: data.target_url || null,
      is_active: data.is_active ?? false,
    });
    await kv.put(key, value, { expirationTtl: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`[KV Cache Set Error] Failed to write key for nfc_uid: ${nfcUid}`, error);
    return false;
  }
}

// ── Cache Deletes ───────────────────────────────────────────────────

/**
 * Invalidates (deletes) the cached card from Cloudflare KV by short_code.
 * Also removes legacy key and NFC key if nfcUid is provided.
 */
export async function deleteCardCache(
  kv: KVNamespace,
  shortCode: string,
  nfcUid?: string | null
): Promise<boolean> {
  try {
    const key = getCardCacheKey(shortCode);
    const legacyKey = `card_url:${shortCode.trim().toLowerCase()}`;
    const promises: Promise<void>[] = [
      kv.delete(key),
      kv.delete(legacyKey),
    ];

    // Also delete NFC cache key if present [v3]
    if (nfcUid) {
      promises.push(kv.delete(getNfcCacheKey(nfcUid)));
    }

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error(`[KV Cache Delete Error] Failed to delete key for short_code: ${shortCode}`, error);
    return false;
  }
}

/**
 * Invalidates NFC cache key only [v3].
 */
export async function deleteNfcCache(
  kv: KVNamespace,
  nfcUid: string
): Promise<boolean> {
  try {
    const key = getNfcCacheKey(nfcUid);
    await kv.delete(key);
    return true;
  } catch (error) {
    console.error(`[KV Cache Delete Error] Failed to delete key for nfc_uid: ${nfcUid}`, error);
    return false;
  }
}
