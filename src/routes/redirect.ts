import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getCardCache, setCardCache } from '../lib/cache';
import { getSupabaseClient } from '../lib/supabase';
import { detectDeviceType, getClientIp } from '../lib/device';

export const redirectRouter = new Hono<{ Bindings: Bindings }>();

/**
 * Background worker task for logging tap analytics without delaying client redirect.
 */
async function recordTapLogAsync(
  env: Bindings,
  cardId: string,
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
 * Main Edge Routing Engine:
 * 1. Checks Cloudflare KV Cache for fastest < 50ms redirection.
 * 2. If Cache Miss -> Queries Supabase REST API & updates KV Cache (TTL = 3600s).
 * 3. Dispatches async tap logging via c.executionCtx.waitUntil().
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
        .select('id, short_code, target_url, is_active')
        .eq('short_code', shortCode)
        .maybeSingle();

      if (error) {
        console.error(`[DB Query Error for short_code: ${shortCode}]`, error.message);
      }

      // If card exists and is active
      if (card && card.is_active && card.target_url) {
        targetUrl = card.target_url;
        cardId = card.id;

        // Populate Cache asynchronously with TTL = 3600s
        if (c.env.CARD_CACHE) {
          c.executionCtx.waitUntil(
            setCardCache(c.env.CARD_CACHE, shortCode, {
              id: card.id,
              target_url: card.target_url,
              is_active: card.is_active,
              short_code: card.short_code,
            }, 3600)
          );
        }
      }
    } catch (err) {
      console.error('[Supabase Client Error]', err);
    }
  }

  // 3. Fallback if card not found or is_active = false
  if (!targetUrl) {
    return c.redirect(fallbackUrl, 302);
  }

  // 4. Non-blocking Background Logging via executionCtx.waitUntil()
  if (cardId) {
    c.executionCtx.waitUntil(
      recordTapLogAsync(c.env, cardId, userAgent, clientIp)
    );
  }

  // 5. Ensure browser does not permanently cache the 302 redirect
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');

  // Return HTTP 302 (Found)
  return c.redirect(targetUrl, 302);
});
