import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const runtime = locals.runtime;
  const env = runtime?.env as { DB?: D1Database; MEDIA?: R2Bucket } | undefined;

  let database = 'unavailable';
  if (env?.DB) {
    try {
      await env.DB.prepare('SELECT 1 AS ok').first();
      database = 'ok';
    } catch {
      database = 'error';
    }
  }

  let media = 'unavailable';
  if (env?.MEDIA) {
    try {
      await env.MEDIA.list({ limit: 1 });
      media = 'ok';
    } catch {
      media = 'error';
    }
  }

  const healthy = database === 'ok' && media === 'ok';

  return new Response(
    JSON.stringify({
      ok: healthy,
      service: 'hidream-pet',
      runtime: 'cloudflare-workers',
      database,
      media,
    }),
    {
      status: healthy ? 200 : 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
};
