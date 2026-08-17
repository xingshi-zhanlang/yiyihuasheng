import { createSession, sessionCookie, verifyPassword } from '../../../_lib/auth';

interface Env {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { username?: string; password?: string };
    const username = body.username?.trim() || '';
    const password = body.password || '';

    if (!context.env.ADMIN_USERNAME || !context.env.ADMIN_PASSWORD_HASH || !context.env.SESSION_SECRET) {
      return Response.json({ ok: false, error: 'Admin authentication is not configured.' }, { status: 503 });
    }

    if (username !== context.env.ADMIN_USERNAME || !(await verifyPassword(password, context.env.ADMIN_PASSWORD_HASH))) {
      return Response.json({ ok: false, error: 'Invalid username or password.' }, { status: 401 });
    }

    const session = await createSession(context.env.SESSION_SECRET, username);
    return new Response(JSON.stringify({ ok: true, username }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie': sessionCookie(session),
      },
    });
  } catch {
    return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
};
