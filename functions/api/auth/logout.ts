import { clearSessionCookie } from '../../../_lib/auth';

export const onRequestPost: PagesFunction = async () =>
  new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': clearSessionCookie() },
  });
