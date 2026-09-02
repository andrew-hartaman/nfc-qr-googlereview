import { Hono } from 'hono';
import type { Bindings, CreateCardInput, UpdateCardInput, ApiResponse, Card } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { deleteCardCache, deleteNfcCache, setCardCache } from '../lib/cache';
import { renderAdminHtml } from '../views/adminHtml';
import {
  generateShortCode,
  validateBatchCount,
  determineIsActive,
  parsePaginationParams
} from '../utils/logic';

export const adminRouter = new Hono<{ Bindings: Bindings }>();

/**
 * GET /admin
 * Serves the HTML admin form interface for NFC/QR card management
 */
adminRouter.get('/admin', (c) => {
  return c.html(renderAdminHtml());
});

/**
 * Optional Admin Authentication Middleware.
 * If ADMIN_API_KEY is configured in environment, verify X-API-Key or Bearer token.
 */
adminRouter.use('/api/*', async (c, next) => {
  const adminApiKey = c.env.ADMIN_API_KEY;

  if (adminApiKey) {
    const authHeader = c.req.header('Authorization');
    const apiKeyHeader = c.req.header('x-api-key');

    const token = apiKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

    if (!token || token !== adminApiKey) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Unauthorized: Invalid or missing API Key',
        },
        401
      );
    }
  }

  await next();
});

/**
 * Helper to determine if a string is a valid UUID
 */
function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * PATCH /api/cards/:identifier
 * Updates card details (target_url, is_active, nfc_uid, etc.) based on short_code.
 * V3: Supports nfc_uid field update with KV cache sync for both card: and nfc: keys.
 */
adminRouter.patch('/api/cards/:identifier', async (c) => {
  const identifier = (c.req.param('identifier') || c.req.param('id') || '').trim();
  const body = await c.req.json<UpdateCardInput>().catch(() => null);

  if (!identifier) {
    return c.json<ApiResponse>({ success: false, error: 'Card short_code or ID is required' }, 400);
  }

  if (!body || Object.keys(body).length === 0) {
    return c.json<ApiResponse>({ success: false, error: 'Request body cannot be empty' }, 400);
  }

  try {
    const supabase = getSupabaseClient(c.env);
    const shortCode = identifier.toLowerCase();

    // 1. Fetch current card by short_code (or fallback to UUID id)
    let { data: existingCard, error: fetchError } = await supabase
      .from('cards')
      .select('id, short_code, nfc_uid, target_url, is_active, user_id')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (!existingCard && isUuidString(identifier)) {
      const { data: byId } = await supabase
        .from('cards')
        .select('id, short_code, nfc_uid, target_url, is_active, user_id')
        .eq('id', identifier)
        .maybeSingle();
      existingCard = byId;
    }

    if (fetchError) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: `Database error: ${fetchError.message}`,
        },
        500
      );
    }

    if (!existingCard) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: `Card with short_code '${identifier}' not found`,
        },
        404
      );
    }

    // 2. Prepare update payload
    const updatePayload: Partial<Card> = {};
    if (body.target_url !== undefined) {
      const url = body.target_url ? body.target_url.trim() : '';
      updatePayload.target_url = url.length > 0 ? url : null;
      // Auto-toggle is_active based on target_url presence
      updatePayload.is_active = determineIsActive(updatePayload.target_url || '');
    } else if (body.is_active !== undefined) {
      // Only allow manual toggle if not overriding via target_url update
      updatePayload.is_active = body.is_active;
    }
    
    if (body.label !== undefined) {
      const label = body.label ? body.label.trim() : '';
      updatePayload.label = label.length > 0 ? label : null;
    }
    if (body.short_code !== undefined) updatePayload.short_code = body.short_code.trim().toLowerCase();
    if (body.user_id !== undefined) updatePayload.user_id = body.user_id;
    // V3: handle nfc_uid update (allow setting to null to unlink)
    if (body.nfc_uid !== undefined) {
      updatePayload.nfc_uid = body.nfc_uid ? body.nfc_uid.trim().toUpperCase() : null;
    }

    // 3. Update database record in Supabase
    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update(updatePayload)
      .eq('id', existingCard.id)
      .select()
      .single();

    if (updateError) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: `Failed to update card: ${updateError.message}`,
        },
        500
      );
    }

    // 4. Sync & Invalidate Cloudflare KV Cache
    if (c.env.CARD_CACHE) {
      const oldShortCode = existingCard.short_code;
      const newShortCode = updatedCard.short_code;
      const oldNfcUid = existingCard.nfc_uid;
      const newNfcUid = updatedCard.nfc_uid;

      if (updatedCard.is_active === false) {
        // If card is deactivated, remove all cache entries
        await deleteCardCache(c.env.CARD_CACHE, oldShortCode, oldNfcUid);
        if (newShortCode !== oldShortCode) {
          await deleteCardCache(c.env.CARD_CACHE, newShortCode, newNfcUid);
        }
      } else {
        // If short_code changed, delete the old cache entry
        if (newShortCode !== oldShortCode) {
          await deleteCardCache(c.env.CARD_CACHE, oldShortCode, oldNfcUid);
        }

        // If NFC UID changed, delete the old NFC cache entry
        if (oldNfcUid && oldNfcUid !== newNfcUid) {
          await deleteNfcCache(c.env.CARD_CACHE, oldNfcUid);
        }

        // Sync fresh data into Cloudflare KV (writes both card: and nfc: keys)
        await setCardCache(c.env.CARD_CACHE, newShortCode, {
          id: updatedCard.id,
          target_url: updatedCard.target_url,
          is_active: updatedCard.is_active,
          short_code: newShortCode,
          nfc_uid: newNfcUid || undefined,
        });
      }
    }

    return c.json<ApiResponse<Card>>({
      success: true,
      message: 'Card updated and KV cache synced successfully',
      data: updatedCard,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<ApiResponse>({ success: false, error: message }, 500);
  }
});

/**
 * POST /api/cards/generate-batch
 * Tahap A: Bulk generates empty cards with random short_codes
 */
adminRouter.post('/api/cards/generate-batch', async (c) => {
  const body = await c.req.json<{ count?: number, label?: string }>().catch(() => null);
  const count = validateBatchCount(body?.count);
  const label = body?.label ? body.label.trim() : null;

  try {
    const supabase = getSupabaseClient(c.env);
    const generated = [];

    for (let i = 0; i < count; i++) {
      let shortCode = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 3) {
        shortCode = generateId();
        const { data } = await supabase.from('cards').select('id').eq('short_code', shortCode).maybeSingle();
        if (!data) isUnique = true;
        attempts++;
      }

      if (!isUnique) continue;

      const { data, error } = await supabase
        .from('cards')
        .insert({
          short_code: shortCode,
          target_url: null,
          is_active: false,
          label: label || null,
        })
        .select('id, short_code, is_active, label')
        .single();

      if (data && !error) {
        generated.push(data);
      }
    }

    return c.json<ApiResponse>({
      success: true,
      message: `Successfully generated ${generated.length} cards`,
      data: generated,
    }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<ApiResponse>({ success: false, error: message }, 500);
  }
});

/**
 * POST /api/cards
 * Creates a new review card.
 * V3: Accepts optional nfc_uid field. Primes both card: and nfc: KV cache keys.
 */
adminRouter.post('/api/cards', async (c) => {
  const body = await c.req.json<CreateCardInput>().catch(() => null);

  if (!body || !body.short_code) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'short_code is a required field',
      },
      400
    );
  }

  try {
    const supabase = getSupabaseClient(c.env);
    const shortCode = body.short_code.trim().toLowerCase();
    const nfcUid = body.nfc_uid ? body.nfc_uid.trim().toUpperCase() : null;

    const { data, error } = await supabase
      .from('cards')
      .insert({
        short_code: shortCode,
        nfc_uid: nfcUid,
        target_url: body.target_url || null,
        user_id: body.user_id || null,
        is_active: body.is_active ?? false,
        label: body.label ? body.label.trim() : null,
      })
      .select()
      .single();

    if (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: `Failed to create card: ${error.message}`,
        },
        error.code === '23505' ? 409 : 500 // Unique violation code
      );
    }

    // If active, prime the KV cache (writes both card: and nfc: keys if nfc_uid present)
    if (c.env.CARD_CACHE && data.is_active) {
      await setCardCache(c.env.CARD_CACHE, data.short_code, {
        id: data.id,
        target_url: data.target_url,
        is_active: data.is_active,
        short_code: data.short_code,
        nfc_uid: data.nfc_uid || undefined,
      });
    }

    return c.json<ApiResponse<Card>>(
      {
        success: true,
        message: 'Card created successfully',
        data,
      },
      201
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<ApiResponse>({ success: false, error: message }, 500);
  }
});

/**
 * GET /api/cards
 * List all cards with optional pagination.
 */
adminRouter.get('/api/cards', async (c) => {
  const { limit, page, offset, status, search } = parsePaginationParams((key: string) => c.req.query(key));

  try {
    const supabase = getSupabaseClient(c.env);
    let query = supabase
      .from('cards')
      .select('*, users(id, name, business_name)', { count: 'exact' });
      
    if (status === 'active') {
      query = query.is('is_active', true).not('target_url', 'is', null);
    } else if (status === 'unassigned') {
      query = query.or('is_active.eq.false,target_url.is.null');
    }

    if (search) {
      query = query.or(`short_code.ilike.%${search}%,nfc_uid.ilike.%${search}%,label.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return c.json<ApiResponse>({ success: false, error: error.message }, 500);
    }

    return c.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        has_more: count ? (offset + limit < count) : false,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<ApiResponse>({ success: false, error: message }, 500);
  }
});

/**
 * GET /api/cards/:identifier
 * Retrieve a specific card with user profile by short_code or UUID.
 */
adminRouter.get('/api/cards/:identifier', async (c) => {
  const identifier = (c.req.param('identifier') || c.req.param('id') || '').trim();

  try {
    const supabase = getSupabaseClient(c.env);
    const shortCode = identifier.toLowerCase();

    let query = supabase
      .from('cards')
      .select('*, users(id, name, business_name, email)');

    let { data, error } = await query.eq('short_code', shortCode).maybeSingle();

    if (!data && isUuidString(identifier)) {
      const res = await supabase
        .from('cards')
        .select('*, users(id, name, business_name, email)')
        .eq('id', identifier)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }

    if (error || !data) {
      return c.json<ApiResponse>({ success: false, error: `Card '${identifier}' not found` }, 404);
    }

    return c.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<ApiResponse>({ success: false, error: message }, 500);
  }
});

/**
 * GET /api/cards/:identifier/analytics
 * Retrieve tap statistics and logs for a specific card by short_code or UUID.
 * V3: Results now include access_type breakdown (QR vs NFC).
 */
adminRouter.get('/api/cards/:identifier/analytics', async (c) => {
  const identifier = (c.req.param('identifier') || c.req.param('id') || '').trim();

  try {
    const supabase = getSupabaseClient(c.env);
    const shortCode = identifier.toLowerCase();

    // Resolve card ID first
    let { data: card } = await supabase
      .from('cards')
      .select('id, short_code')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (!card && isUuidString(identifier)) {
      const res = await supabase
        .from('cards')
        .select('id, short_code')
        .eq('id', identifier)
        .maybeSingle();
      card = res.data;
    }

    if (!card) {
      return c.json<ApiResponse>({ success: false, error: `Card '${identifier}' not found` }, 404);
    }

    const cardId = card.id;

    // Fetch total tap count and recent logs
    const [logsResult, totalResult] = await Promise.all([
      supabase
        .from('tap_logs')
        .select('*')
        .eq('card_id', cardId)
        .order('tapped_at', { ascending: false })
        .limit(100),
      supabase
        .from('tap_logs')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', cardId),
    ]);

    if (logsResult.error) {
      return c.json<ApiResponse>({ success: false, error: logsResult.error.message }, 500);
    }

    const logs = logsResult.data || [];
    const totalTaps = totalResult.count || 0;

    // Aggregate by device type
    const deviceBreakdown = logs.reduce<Record<string, number>>((acc, log) => {
      const dev = log.device_type || 'Other';
      acc[dev] = (acc[dev] || 0) + 1;
      return acc;
    }, {});

    // V3: Aggregate by access type (QR vs NFC)
    const accessBreakdown = logs.reduce<Record<string, number>>((acc, log) => {
      const accessType = log.access_type || 'QR';
      acc[accessType] = (acc[accessType] || 0) + 1;
      return acc;
    }, {});

    return c.json({
      success: true,
      data: {
        card_id: cardId,
        short_code: card.short_code,
        total_taps: totalTaps,
        device_breakdown: deviceBreakdown,
        access_breakdown: accessBreakdown,
        recent_logs: logs.slice(0, 20),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<ApiResponse>({ success: false, error: message }, 500);
  }
});
