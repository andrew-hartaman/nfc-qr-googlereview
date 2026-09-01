import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import type { Bindings, ApiResponse } from './types';
import { redirectRouter } from './routes/redirect';
import { adminRouter } from './routes/admin';

const app = new Hono<{ Bindings: Bindings }>();

// Global Middlewares
app.use('*', cors());
app.use('*', prettyJSON());

// Health Check & Root Info
app.get('/', (c) => {
  return c.json({
    name: 'Dynamic Review Card Engine',
    version: '2.0.0',
    status: 'online',
    runtime: 'Cloudflare Workers / Edge',
    docs: {
      redirect: 'GET /r/:short_code',
      admin_update: 'PATCH /api/cards/:id',
      admin_create: 'POST /api/cards',
      admin_analytics: 'GET /api/cards/:id/analytics',
    },
  });
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

export default app;
