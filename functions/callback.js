// GitHub OAuth callback for Decap CMS.
// Exchanges the authorization code server-side, then hands the token to the
// waiting Decap popup through window.postMessage.
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const stateCookie = readCookie(request.headers.get('Cookie') || '', 'decap_oauth_state');

  if (!code || !returnedState || !stateCookie || returnedState !== stateCookie) {
    return htmlMessage('authorization:github:error:{"error":"Invalid OAuth state"}', url.origin);
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return htmlMessage('authorization:github:error:{"error":"CMS authentication is not configured"}', url.origin);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'HiDREAM-Decap-CMS',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    const errorText = tokenData.error_description || tokenData.error || 'GitHub authorization failed';
    return htmlMessage(
      `authorization:github:error:${JSON.stringify({ error: errorText })}`,
      url.origin,
    );
  }

  const payload = JSON.stringify({ token: tokenData.access_token, provider: 'github' });
  const message = `authorization:github:success:${payload}`;

  return new Response(
    `<!doctype html><html><body><script>
      (function () {
        const message = ${JSON.stringify(message)};
        let sent = false;
        function receiveMessage(event) {
          if (sent) return;
          if (typeof event.data === 'string' && event.data.indexOf('authorizing:github') === 0) {
            sent = true;
            if (window.opener) window.opener.postMessage(message, event.origin);
            window.removeEventListener('message', receiveMessage);
            setTimeout(() => window.close(), 300);
          }
        }
        window.addEventListener('message', receiveMessage, false);
        if (window.opener) window.opener.postMessage('authorizing:github', '*');
        setTimeout(() => {
          if (!sent && window.opener) {
            sent = true;
            window.opener.postMessage(message, ${JSON.stringify(url.origin)});
            setTimeout(() => window.close(), 300);
          }
        }, 1500);
      })();
    <\/script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'decap_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
        // Needed so the popup can communicate with the opener.
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
    },
  );
}

function readCookie(cookieHeader, name) {
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function htmlMessage(message, origin) {
  return new Response(
    `<!doctype html><html><body><script>
      (function () {
        const message = ${JSON.stringify(message)};
        if (window.opener) {
          window.opener.postMessage('authorizing:github', '*');
          window.opener.postMessage(message, ${JSON.stringify(origin)});
          setTimeout(() => window.close(), 500);
        }
      })();
    <\/script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
    },
  );
}
