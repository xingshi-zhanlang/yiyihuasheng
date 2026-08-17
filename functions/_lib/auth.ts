const textEncoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, textEncoder.encode(data)));
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [saltB64, iterationsRaw, hashB64] = encoded.split(':');
  const iterations = Number(iterationsRaw);
  if (!saltB64 || !Number.isFinite(iterations) || !hashB64 || iterations < 100_000) return false;

  const salt = fromBase64Url(saltB64);
  const expected = fromBase64Url(hashB64);
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const actual = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      key,
      expected.length * 8,
    ),
  );

  return crypto.subtle.timingSafeEqual(actual, expected);
}

export async function createSession(secret: string, username: string, ttlSeconds = 60 * 60 * 8): Promise<string> {
  const payload = JSON.stringify({
    sub: username,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: crypto.randomUUID(),
  });
  const encodedPayload = toBase64Url(textEncoder.encode(payload));
  const signature = toBase64Url(await hmac(secret, encodedPayload));
  return `${encodedPayload}.${signature}`;
}

export async function verifySession(secret: string, cookieValue: string | null): Promise<string | null> {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const [payloadB64, signatureB64] = cookieValue.split('.', 2);
  if (!payloadB64 || !signatureB64) return null;

  const expected = await hmac(secret, payloadB64);
  const supplied = fromBase64Url(signatureB64);
  if (expected.length !== supplied.length || !crypto.subtle.timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as { sub?: string; exp?: number };
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function sessionCookie(value: string, maxAge = 60 * 60 * 8): string {
  return `hidream_admin=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return 'hidream_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}

export function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie') || '';
  for (const part of cookies.split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key === name) return valueParts.join('=') || null;
  }
  return null;
}
