import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import type { Bindings, ApiResponse } from './types';
import { redirectRouter } from './routes/redirect';
import { adminRouter } from './routes/admin';
import { getSupabaseClient } from './lib/supabase';

const app = new Hono<{ Bindings: Bindings }>();

// Global Middlewares
app.use('*', cors());
app.use('*', prettyJSON());

// Root Route: Redirect to fallback URL to hide internal endpoints structure
app.get('/', (c) => {
  const fallbackUrl = c.env.DEFAULT_FALLBACK_URL || 'https://google.com';
  return c.redirect(fallbackUrl, 302);
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.route('/', redirectRouter);
app.route('/', adminRouter);

// Global 404 Handler
app.notFound((c) => {
  const fallbackUrl = c.env.DEFAULT_FALLBACK_URL || 'https://google.com';
  // If user requests a non-API unknown route, redirect to fallback
  if (!c.req.path.startsWith('/api/')) {
    return c.redirect(fallbackUrl, 302);
  }

  return c.json<ApiResponse>(
    {
      success: false,
      error: 'Endpoint not found',
    },
    404
  );
});

// Global Error Handler
app.onError((err, c) => {
  console.error('[Unhandled Server Error]:', err);
  return c.json<ApiResponse>(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[Cron Trigger] Supabase Keep-Alive triggered at ${timestamp} (cron: "${controller.cron}")`);

    ctx.waitUntil(
      (async () => {
        try {
          const supabase = getSupabaseClient(env);
          const start = Date.now();
          // Lightweight ping query to reset Supabase 7-day inactivity timer
          const { data, error } = await supabase.from('cards').select('id').limit(1);
          const duration = Date.now() - start;

          if (error) {
            console.error(`[Cron Trigger Error] Supabase ping failed: ${error.message}`);
          } else {
            console.log(`[Cron Trigger Success] Supabase kept active (${duration}ms). Rows returned: ${data?.length ?? 0}`);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error(`[Cron Trigger Error] Supabase ping exception: ${message}`);
        }
      })()
    );
  },
};
