// GitHub OAuth entry point for Decap CMS.
// Runs as a Cloudflare Pages Function; no VPS/server is required.
export async function onRequest({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response('CMS authentication is not configured.', { status: 503 });
  }

  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/callback`;
  const github = new URL('https://github.com/login/oauth/authorize');

  github.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  github.searchParams.set('redirect_uri', redirectUri);
  github.searchParams.set('scope', 'repo,user:read');
  github.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: github.toString(),
      'Set-Cookie': `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      'Cache-Control': 'no-store',
    },
  });
}
