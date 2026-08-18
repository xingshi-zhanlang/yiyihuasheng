import type { APIRoute } from 'astro';
import { signAdminSession, sessionCookie, verifyAdminCredentials, type AdminEnv } from '../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env || {}) as AdminEnv;
  let body: { user?: string; password?: string };
  try {
    body = (await request.json()) as { user?: string; password?: string };
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const user = String(body.user || '').trim();
  const password = String(body.password || '');
  if (!user || !password || user.length > 120 || password.length > 512) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid credentials' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }

  const valid = await verifyAdminCredentials(env, user, password);
  if (!valid) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid credentials' }), { status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }

  const token = await signAdminSession(env, user);
  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'Set-Cookie': sessionCookie(token),
    },
  });
};
