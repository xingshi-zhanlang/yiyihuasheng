# HiDREAM CMS operating model

## Admin

The public-friendly admin entrypoint is `/admin`. It redirects to EmDash's authenticated admin at `/_emdash/admin`.

The old GitHub-backed static CMS has been removed. Content is now intended to live in EmDash + Cloudflare D1, and media uploads in Cloudflare R2.

EmDash's default authentication is passkey-based rather than username/password. This is deliberate: passkeys avoid storing a reusable admin password. A custom username/password provider can be added later if there is a hard operational requirement, but it should not replace the secure default without rate limiting, password hashing, session rotation and recovery controls.

## Content model

The seed model contains:

- `products` — B2B products, variants, specifications, MOQ, OEM/ODM and SEO fields.
- `collections` — storefront product groups and covers.
- `homepage_sections` — editable homepage sections, images, CTAs and product selections.
- `site_settings` — brand, SEO defaults, contact details, WhatsApp and navigation.

## Media

Product originals and homepage images are intended to be uploaded through EmDash and stored in the `MEDIA` R2 binding. Do not commit future high-resolution catalog images to Git unless they are required as source assets.

## Runtime verification

After the Worker has been deployed and the D1/R2 bindings exist, open `/api/health`.

A healthy response is HTTP 200 and reports:

```json
{
  "ok": true,
  "database": "ok",
  "media": "ok"
}
```

If either binding is unavailable, the endpoint returns HTTP 503 without caching the response.

## Domain-free workflow

The CMS can be initialized on the `workers.dev` hostname. Do not put the future `.com` hostname into source code. `PUBLIC_SITE_URL` / EmDash `siteUrl` can be supplied as environment configuration when the final domain is purchased.
