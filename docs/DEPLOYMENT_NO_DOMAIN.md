# HiDREAM deployment before buying the domain

The project is intentionally domain-neutral until the production `.com` domain is purchased.

## Current architecture

- Astro 7 storefront rendered by a Cloudflare Worker
- EmDash CMS for Admin/content management
- Cloudflare D1 for structured content
- Cloudflare R2 for original/high-resolution media
- WhatsApp inquiry cart; no online checkout
- No VPS
- No public GitHub login for the Admin

## Local development

Create `.dev.vars` from `.dev.vars.example` when local secrets are needed. Keep the real file uncommitted.

The default local site URL is:

```text
http://localhost:4321
```

## Cloudflare preview without a custom domain

A Worker can be tested on its Cloudflare-provided `workers.dev` hostname before a custom domain exists.

Set the Worker/preview environment variable:

```text
PUBLIC_SITE_URL=https://<your-worker-subdomain>.workers.dev
```

Do not commit the real hostname if it is temporary or account-specific; configure it in the Cloudflare environment instead.

## D1

Create a preview D1 database and put its ID into the non-production Wrangler environment. The repository intentionally keeps a placeholder ID in source control so no account-specific infrastructure identifier is committed accidentally.

Expected binding:

```text
DB
```

The EmDash integration uses this binding for content and sessions.

## R2

Create a preview bucket and bind it as:

```text
MEDIA
```

Use R2 for original/high-resolution product images, gallery images and homepage media. Git should contain only code and small fixture assets.

## CMS bootstrap

From a configured Cloudflare environment:

```bash
pnpm install
pnpm emdash types
pnpm migrate:products
pnpm build
```

Run the migration against a preview database first. Do not run the migration against production until the imported record count and media mappings have been reviewed.

## Domain cutover later

When the `.com` domain is purchased:

1. Add the domain/zone to Cloudflare.
2. Point the domain's nameservers to Cloudflare.
3. Set `PUBLIC_SITE_URL=https://example.com` in the production environment.
4. Set the EmDash `siteUrl` through the same environment-driven configuration.
5. Confirm canonical URLs, sitemap, Open Graph URLs and hreflang output.
6. Only then attach the custom domain to the Worker.

No application code should need to change for this cutover.

## Pre-domain acceptance checklist

- [ ] Worker preview responds on `workers.dev`.
- [ ] Admin login works through EmDash authentication.
- [ ] Product CRUD works in preview D1.
- [ ] R2 image upload/read works.
- [ ] Homepage sections are editable.
- [ ] Product detail pages read CMS data.
- [ ] Inquiry cart sends name/SKU/quantity/URL to WhatsApp.
- [ ] Sitemap and canonical use `PUBLIC_SITE_URL`.
- [ ] No production secret or infrastructure ID is committed.
