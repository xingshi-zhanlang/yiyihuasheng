import type { APIRoute } from 'astro';
import { csrfOk, requireAdmin, type AdminEnv } from '../../../lib/admin-auth';

type Env = AdminEnv & { GITHUB_TOKEN?: string; GITHUB_REPO?: string; GITHUB_BRANCH?: string };
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

function out(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS }); }

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env || {}) as unknown as Env;
  if (!(await requireAdmin(request, env)) || !csrfOk(request)) return out({ ok: false, error: 'Unauthorized' }, 401);
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return out({ ok: false, error: 'GitHub media publishing is not configured' }, 503);
  let body: { filename?: string; contentBase64?: string };
  try { body = (await request.json()) as { filename?: string; contentBase64?: string }; } catch { return out({ ok: false, error: 'Invalid JSON' }, 400); }
  const rawName = String(body.filename || '').trim();
  const content = String(body.contentBase64 || '').trim();
  if (!rawName || !content) return out({ ok: false, error: 'Missing file' }, 400);
  const filename = rawName.replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!/\.(png|jpe?g|webp|gif)$/i.test(filename)) return out({ ok: false, error: 'Only PNG, JPG, JPEG, WebP and GIF are allowed' }, 400);
  if (content.length > 1_400_000) return out({ ok: false, error: 'File is too large for the zero-cost GitHub publisher' }, 413);
  const branch = env.GITHUB_BRANCH || 'main';
  const path = `public/images/uploads/${filename}`;
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`;
  const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'HiDREAM-Admin' };
  const existing = await fetch(url, { headers });
  const existingData = existing.ok ? await existing.json() as { sha?: string } : null;
  const response = await fetch(url, { method: 'PUT', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ message: `chore: upload media ${filename}`, content, branch, ...(existingData?.sha ? { sha: existingData.sha } : {}) }) });
  if (!response.ok) { const text = await response.text(); return out({ ok: false, error: 'GitHub upload failed', detail: text.slice(0, 500) }, 502); }
  return out({ ok: true, path: `/${path}`, url: `/${path}` }, 201);
};
