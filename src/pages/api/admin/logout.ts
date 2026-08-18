import type { APIRoute } from 'astro';
import { expiredSessionCookie, requireAdmin, type AdminEnv } from '../../../lib/admin-auth';

export const prerender = false;

type Env = AdminEnv;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env || {}) as unknown as Env;
  if (!(await requireAdmin(request, env))) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'Set-Cookie': expiredSessionCookie } });
};
