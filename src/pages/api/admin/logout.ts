import type { APIRoute } from 'astro';
import { expiredSessionCookie, requireAdmin } from '../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env || {}) as Record<string, unknown>;
  const session = await requireAdmin(request, env);
  if (!session) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'Set-Cookie': expiredSessionCookie },
  });
};
