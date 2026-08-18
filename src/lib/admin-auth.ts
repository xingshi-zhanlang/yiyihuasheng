const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

async function sha256(value: string): Promise<string> {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

export type AdminEnv = {
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

export type AdminSession = { user: string; exp: number };

export async function verifyAdminCredentials(env: AdminEnv, user: string, password: string): Promise<boolean> {
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD) return false;
  const [expectedUser, providedUser, expectedPassword, providedPassword] = await Promise.all([
    sha256(env.ADMIN_USER),
    sha256(user),
    sha256(env.ADMIN_PASSWORD),
    sha256(password),
  ]);
  return expectedUser === providedUser && expectedPassword === providedPassword;
}

export async function signAdminSession(env: AdminEnv, user: string, ttlSeconds = 60 * 60 * 8): Promise<string> {
  if (!env.ADMIN_SESSION_SECRET) throw new Error('ADMIN_SESSION_SECRET is not configured');
  const payload = toBase64Url(encoder.encode(JSON.stringify({ user, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  const signature = await hmac(env.ADMIN_SESSION_SECRET, payload);
  return `${payload}.${signature}`;
}

export async function verifyAdminSession(env: AdminEnv, token: string | null): Promise<AdminSession | null> {
  if (!env.ADMIN_SESSION_SECRET || !token) return null;
  const [payload, signature] = token.split('.', 2);
  if (!payload || !signature) return null;
  const expected = await hmac(env.ADMIN_SESSION_SECRET, payload);
  if (expected !== signature) return null;
  try {
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as AdminSession;
    if (!session?.user || typeof session.exp !== 'number' || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function getSessionCookie(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)hidream_admin=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireAdmin(request: Request, env: AdminEnv): Promise<AdminSession | null> {
  return verifyAdminSession(env, getSessionCookie(request));
}

export function sessionCookie(token: string, maxAge = 60 * 60 * 8): string {
  return `hidream_admin=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export const expiredSessionCookie = 'hidream_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict';

export function csrfOk(request: Request): boolean {
  return request.headers.get('X-Admin-Request') === '1';
}
