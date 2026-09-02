import { Hono } from 'hono';
import type { Bindings, AccessType } from '../types';
import { getCardCache, getCardCacheByNfc, setCardCache } from '../lib/cache';
import { getSupabaseClient } from '../lib/supabase';
import { detectDeviceType, getClientIp } from '../lib/device';

export const redirectRouter = new Hono<{ Bindings: Bindings }>();

/**
 * Background worker task for logging tap analytics without delaying client redirect.
 * V3: Added accessType parameter to distinguish QR vs NFC access.
 */
async function recordTapLogAsync(
  env: Bindings,
  cardId: string,
  accessType: AccessType,
  userAgent: string | null,
  ipAddress: string
): Promise<void> {
  if (!cardId) {
    return;
  }

  try {
    const supabase = getSupabaseClient(env);
    const deviceType = detectDeviceType(userAgent);

    const { error } = await supabase.from('tap_logs').insert({
      card_id: cardId,
      access_type: accessType,
      device_type: deviceType,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    if (error) {
      console.error('[Async Tap Logging Failed]:', error.message);
    }
  } catch (err) {
    console.error('[Async Tap Logging Error]:', err);
  }
}

/**
 * GET /r/:short_code
 * Main Edge Routing Engine (QR Code Entry-Point):
 * 1. Checks Cloudflare KV Cache for fastest < 50ms redirection.
 * 2. If Cache Miss -> Queries Supabase REST API & updates KV Cache (TTL = 3600s).
 * 3. Dispatches async tap logging via c.executionCtx.waitUntil() with access_type = 'QR'.
 * 4. Returns HTTP 302 Temporary Redirect to target Google Review URL.
 */
redirectRouter.get('/r/:short_code', async (c) => {
  const shortCodeParam = c.req.param('short_code');
  const fallbackUrl = c.env.DEFAULT_FALLBACK_URL || 'https://google.com';

  if (!shortCodeParam) {
    return c.redirect(fallbackUrl, 302);
  }

  const shortCode = shortCodeParam.trim().toLowerCase();
  const userAgent = c.req.header('user-agent') || null;
  const clientIp = getClientIp(c.req.raw.headers);

  let targetUrl: string | null = null;
  let cardId: string | null = null;
  let isInactiveCard = false;

  // 1. Cache-First: Check Cloudflare KV Store
  if (c.env.CARD_CACHE) {
    const cached = await getCardCache(c.env.CARD_CACHE, shortCode);
    if (cached && cached.target_url) {
      targetUrl = cached.target_url;
      cardId = cached.id || null;
    }
  }

  // 2. Cache-Miss: Query Supabase PostgreSQL via REST API
  if (!targetUrl) {
    try {
      const supabase = getSupabaseClient(c.env);
      const { data: card, error } = await supabase
        .from('cards')
        .select('id, short_code, nfc_uid, target_url, is_active')
        .eq('short_code', shortCode)
        .maybeSingle();

      if (error) {
        console.error(`[DB Query Error for short_code: ${shortCode}]`, error.message);
      }

      // If card exists
      if (card) {
        if (card.is_active && card.target_url) {
          targetUrl = card.target_url;
          cardId = card.id;

          // Populate Cache asynchronously with TTL = 3600s
          if (c.env.CARD_CACHE) {
            c.executionCtx.waitUntil(
              setCardCache(c.env.CARD_CACHE, shortCode, {
                id: card.id,
                target_url: card.target_url || null,
                is_active: card.is_active,
                short_code: card.short_code,
                nfc_uid: card.nfc_uid || undefined,
              }, 3600)
            );
          }
        } else {
          isInactiveCard = true;
          cardId = card.id; // Still record tap even if inactive? Usually yes, helps debugging
        }
      }
    } catch (err) {
      console.error('[Supabase Client Error]', err);
    }
  }

  // 3. Fallback if card not found or is_active = false
  if (!targetUrl) {
    if (isInactiveCard) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kartu Belum Aktif</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8fafc; color: #334155; text-align: center; padding: 20px; box-sizing: border-box; }
            .card { background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); max-width: 400px; width: 100%; }
            h1 { font-size: 1.4rem; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
            p { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0; }
            .icon { font-size: 3.5rem; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Kartu Belum Aktif</h1>
            <p>Kartu dengan ID <strong>${shortCode}</strong> belum diatur target URL-nya atau sedang dinonaktifkan sementara.</p>
            <p style="margin-top: 16px;">Silakan hubungi administrator untuk mengaktifkannya.</p>
          </div>
        </body>
        </html>
      `);
    }
    return c.redirect(fallbackUrl, 302);
  }

  // 4. Non-blocking Background Logging via executionCtx.waitUntil()
  if (cardId) {
    c.executionCtx.waitUntil(
      recordTapLogAsync(c.env, cardId, 'QR', userAgent, clientIp)
    );
  }

  // 5. Ensure browser does not permanently cache the 302 redirect
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');

  // Return HTTP 302 (Found)
  return c.redirect(targetUrl, 302);
});

/**
 * GET /nfc/:nfc_uid  [NEW v3]
 * NFC Chip Entry-Point Resolver:
 * 1. Checks Cloudflare KV Cache key `nfc:{nfc_uid}`.
 * 2. If Cache Miss -> Queries Supabase `cards WHERE nfc_uid = :uid`.
 * 3. Dispatches async tap logging with access_type = 'NFC'.
 * 4. Returns HTTP 302 Temporary Redirect to target Google Review URL.
 */
redirectRouter.get('/nfc/:nfc_uid', async (c) => {
  const nfcUidParam = c.req.param('nfc_uid');
  const fallbackUrl = c.env.DEFAULT_FALLBACK_URL || 'https://google.com';

  if (!nfcUidParam) {
    return c.redirect(fallbackUrl, 302);
  }

  const nfcUid = nfcUidParam.trim().toUpperCase();
  const userAgent = c.req.header('user-agent') || null;
  const clientIp = getClientIp(c.req.raw.headers);

  let targetUrl: string | null = null;
  let cardId: string | null = null;
  let isInactiveCard = false;

  // 1. Cache-First: Check Cloudflare KV Store by NFC UID
  if (c.env.CARD_CACHE) {
    const cached = await getCardCacheByNfc(c.env.CARD_CACHE, nfcUid);
    if (cached && cached.target_url) {
      targetUrl = cached.target_url;
      cardId = cached.id || null;
    }
  }

  // 2. Cache-Miss: Query Supabase by nfc_uid
  if (!targetUrl) {
    try {
      const supabase = getSupabaseClient(c.env);
      const { data: card, error } = await supabase
        .from('cards')
        .select('id, short_code, nfc_uid, target_url, is_active')
        .eq('nfc_uid', nfcUid)
        .maybeSingle();

      if (error) {
        console.error(`[DB Query Error for nfc_uid: ${nfcUid}]`, error.message);
      }

      if (card) {
        if (card.is_active && card.target_url) {
          targetUrl = card.target_url;
          cardId = card.id;

          // Populate both card: and nfc: cache keys
          if (c.env.CARD_CACHE) {
            c.executionCtx.waitUntil(
              setCardCache(c.env.CARD_CACHE, card.short_code, {
                id: card.id,
                target_url: card.target_url || null,
                is_active: card.is_active,
                short_code: card.short_code,
                nfc_uid: card.nfc_uid || undefined,
              }, 3600)
            );
          }
        } else {
          isInactiveCard = true;
          cardId = card.id;
        }
      }
    } catch (err) {
      console.error('[Supabase Client Error]', err);
    }
  }

  // 3. Fallback
  if (!targetUrl) {
    if (isInactiveCard) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kartu Belum Aktif</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8fafc; color: #334155; text-align: center; padding: 20px; box-sizing: border-box; }
            .card { background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); max-width: 400px; width: 100%; }
            h1 { font-size: 1.4rem; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
            p { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0; }
            .icon { font-size: 3.5rem; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Kartu Belum Aktif</h1>
            <p>Chip NFC dengan ID <strong>${nfcUid}</strong> belum diatur target URL-nya atau sedang dinonaktifkan sementara.</p>
            <p style="margin-top: 16px;">Silakan hubungi administrator untuk mengaktifkannya.</p>
          </div>
        </body>
        </html>
      `);
    }
    return c.redirect(fallbackUrl, 302);
  }

  // 4. Non-blocking Background Logging (access_type = 'NFC')
  if (cardId) {
    c.executionCtx.waitUntil(
      recordTapLogAsync(c.env, cardId, 'NFC', userAgent, clientIp)
    );
  }

  // 5. No-cache headers
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');

  return c.redirect(targetUrl, 302);
});
