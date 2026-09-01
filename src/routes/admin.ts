import { Hono } from 'hono';
import type { Bindings, CreateCardInput, UpdateCardInput, ApiResponse, Card } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { deleteCardCache, setCardCache } from '../lib/cache';

export const adminRouter = new Hono<{ Bindings: Bindings }>();

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
 * PATCH /api/cards/:id or /api/cards/:short_code
 * Updates card details (target_url, is_active, etc.) based on short_code.
 * Syncs the updated data directly to Cloudflare KV or invalidates if inactive.
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
      .select('id, short_code, target_url, is_active, user_id')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (!existingCard && isUuidString(identifier)) {
      const { data: byId } = await supabase
        .from('cards')
        .select('id, short_code, target_url, is_active, user_id')
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
    if (body.target_url !== undefined) updatePayload.target_url = body.target_url;
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;
    if (body.short_code !== undefined) updatePayload.short_code = body.short_code.trim().toLowerCase();
    if (body.user_id !== undefined) updatePayload.user_id = body.user_id;

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

      if (updatedCard.is_active === false) {
        // If card is deactivated, remove from cache immediately
        await deleteCardCache(c.env.CARD_CACHE, oldShortCode);
        if (newShortCode !== oldShortCode) {
          await deleteCardCache(c.env.CARD_CACHE, newShortCode);
        }
      } else {
        // If short_code changed, delete the old cache entry
        if (newShortCode !== oldShortCode) {
          await deleteCardCache(c.env.CARD_CACHE, oldShortCode);
        }

        // Sync fresh data into Cloudflare KV with key `card:${newShortCode}`
        await setCardCache(c.env.CARD_CACHE, newShortCode, {
          id: updatedCard.id,
          target_url: updatedCard.target_url,
          is_active: updatedCard.is_active,
          short_code: newShortCode,
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
 * POST /api/cards
 * Creates a new review card.
 */
adminRouter.post('/api/cards', async (c) => {
  const body = await c.req.json<CreateCardInput>().catch(() => null);

  if (!body || !body.short_code || !body.target_url) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'short_code and target_url are required fields',
      },
      400
    );
  }

  try {
    const supabase = getSupabaseClient(c.env);
    const shortCode = body.short_code.trim().toLowerCase();

    const { data, error } = await supabase
      .from('cards')
      .insert({
        short_code: shortCode,
        target_url: body.target_url,
        user_id: body.user_id || null,
        is_active: body.is_active ?? true,
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

    // If active, optionally prime the KV cache
    if (c.env.CARD_CACHE && data.is_active) {
      await setCardCache(c.env.CARD_CACHE, data.short_code, {
        id: data.id,
        target_url: data.target_url,
        is_active: data.is_active,
        short_code: data.short_code,
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
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const page = Math.max(parseInt(c.req.query('page') || '1', 10), 1);
  const offset = (page - 1) * limit;

  try {
    const supabase = getSupabaseClient(c.env);
    const { data, error, count } = await supabase
      .from('cards')
      .select('*, users(id, name, business_name)', { count: 'exact' })
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

    return c.json({
      success: true,
      data: {
        card_id: cardId,
        short_code: card.short_code,
        total_taps: totalTaps,
        device_breakdown: deviceBreakdown,
        recent_logs: logs.slice(0, 20),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<ApiResponse>({ success: false, error: message }, 500);
  }
});
