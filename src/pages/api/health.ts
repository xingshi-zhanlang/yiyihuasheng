import type { APIRoute } from 'astro';

export const prerender = false;

type WorkerEnv = { DB?: D1Database };

export const GET: APIRoute = async ({ locals }) => {
  const runtime = locals.runtime;
  const env = runtime?.env as WorkerEnv | undefined;

  let database = 'unavailable';
  if (env?.DB) {
    try {
      await env.DB.prepare('SELECT 1 AS ok').first();
      database = 'ok';
    } catch {
      database = 'error';
    }
  }

  const staticAssets = 'configured';
  const healthy = database === 'ok';

  return new Response(
    JSON.stringify({
      ok: healthy,
      service: 'hidream-pet',
      runtime: 'cloudflare-workers',
      database,
      media: staticAssets,
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
