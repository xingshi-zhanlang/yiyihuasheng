import { getCookie, verifySession } from '../../../_lib/auth';

interface Env { SESSION_SECRET?: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const username = context.env.SESSION_SECRET
    ? await verifySession(context.env.SESSION_SECRET, getCookie(context.request, 'hidream_admin'))
    : null;

  if (!username) return Response.json({ ok: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return Response.json({ ok: true, username }, { headers: { 'Cache-Control': 'no-store' } });
};
