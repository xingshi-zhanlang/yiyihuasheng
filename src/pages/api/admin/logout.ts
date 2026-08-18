import type { APIRoute } from 'astro';
import { expiredSessionCookie, requireAdmin } from '../../../lib/admin-auth';

type AdminEnv = {
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  DB?: D1Database;
};

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env as AdminEnv | undefined;
  const session = await requireAdmin(request, env ?? {});
  if (!session) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'Set-Cookie': expiredSessionCookie },
  });
};
