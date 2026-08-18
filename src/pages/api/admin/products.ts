import type { APIRoute } from 'astro';
import { csrfOk, requireAdmin, type AdminEnv } from '../../../lib/admin-auth';

export const prerender = false;

type Env = AdminEnv & { DB?: D1Database };

async function ready(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_zh TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image TEXT,
    gallery_json TEXT NOT NULL DEFAULT '[]',
    variants_json TEXT NOT NULL DEFAULT '[]',
    moq TEXT NOT NULL DEFAULT '',
    oem INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    seo_title TEXT NOT NULL DEFAULT '',
    seo_description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
}

function out(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env || {}) as unknown as Env;
  if (!(await requireAdmin(request, env))) return out({ ok: false, error: 'Unauthorized' }, 401);
  if (!env.DB) return out({ ok: false, error: 'D1 is not configured' }, 503);
  await ready(env.DB);
  const result = await env.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC').all();
  return out({ ok: true, products: result.results || [] });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env || {}) as unknown as Env;
  if (!(await requireAdmin(request, env)) || !csrfOk(request)) return out({ ok: false, error: 'Unauthorized' }, 401);
  if (!env.DB) return out({ ok: false, error: 'D1 is not configured' }, 503);
  const body = (await request.json()) as Record<string, unknown>;
  const slug = String(body.slug || '').trim().toLowerCase();
  const nameEn = String(body.nameEn || '').trim();
  const nameZh = String(body.nameZh || '').trim();
  const category = String(body.category || '').trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !nameEn || !nameZh || !category) return out({ ok: false, error: 'Invalid product fields' }, 400);
  await ready(env.DB);
  const id = String(body.id || crypto.randomUUID());
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO products (id,slug,name_en,name_zh,category,description,image,gallery_json,variants_json,moq,oem,status,seo_title,seo_description,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name_en=excluded.name_en,name_zh=excluded.name_zh,category=excluded.category,description=excluded.description,image=excluded.image,gallery_json=excluded.gallery_json,variants_json=excluded.variants_json,moq=excluded.moq,oem=excluded.oem,status=excluded.status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,updated_at=excluded.updated_at`).bind(
      id,
      slug,
      nameEn,
      nameZh,
      category,
      String(body.description || ''),
      body.image ? String(body.image) : null,
      JSON.stringify(Array.isArray(body.gallery) ? body.gallery : []),
      JSON.stringify(Array.isArray(body.variants) ? body.variants : []),
      String(body.moq || ''),
      body.oem ? 1 : 0,
      body.status === 'published' ? 'published' : 'draft',
      String(body.seoTitle || ''),
      String(body.seoDescription || ''),
      now,
      now,
    ).run();
  return out({ ok: true, id });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env || {}) as unknown as Env;
  if (!(await requireAdmin(request, env)) || !csrfOk(request)) return out({ ok: false, error: 'Unauthorized' }, 401);
  if (!env.DB) return out({ ok: false, error: 'D1 is not configured' }, 503);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return out({ ok: false, error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return out({ ok: true });
};
