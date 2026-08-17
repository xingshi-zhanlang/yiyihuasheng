# HiDREAM CMS / Commerce Refactor Plan

## Goal

Turn the current Astro brand site into a Cloudflare-native, low-cost headless brand-commerce site:

- Astro storefront
- Cloudflare Workers / Pages deployment
- EmDash CMS for administration and content modeling
- D1 for structured content
- R2 for original/high-resolution media
- WhatsApp inquiry cart instead of on-site checkout
- One public domain
- No VPS
- No GitHub login exposed to site administrators

## Non-goals for v1

- Online payment
- Customer accounts
- Inventory synchronization
- Full checkout/order management
- Plugin sandbox
- Complex ERP integration

## Migration principles

1. Preserve the current `main` branch until the new stack is verified.
2. Keep the existing storefront visual language as the reference; replace data plumbing before redesigning UI.
3. Import existing product data rather than re-entering it manually.
4. Keep an adapter layer so storefront components can consume a stable Product model while the CMS backend changes.
5. Store originals in R2 and serve responsive derivatives through the image/CDN layer.
6. Never commit admin credentials, OAuth secrets, session secrets, or production database credentials.
7. Treat image licensing as a separate requirement: only ingest assets that HiDREAM has rights to use.

## Content model

### Product

- `slug`
- `name`
- `nameZh`
- `sku`
- `status`
- `category`
- `shortDescription`
- `description`
- `features[]`
- `coverImage`
- `gallery[]`
- `lifestyleImages[]`
- `detailImages[]`
- `variants[]` (sku, color, size, specs)
- `moq`
- `oem`
- `odm`
- `leadTime`
- `seoTitle`
- `seoDescription`
- `ogImage`

### Homepage

Sections are data-driven and ordered:

- Hero
- Brand story
- Collection grid
- Featured products
- OEM/ODM
- Testimonials
- CTA

Each image-bearing section has explicit desktop/mobile or cover/gallery media fields where appropriate.

### Site settings

- brand name
- site title
- site description
- logo
- favicon
- OG default image
- WhatsApp number
- sales email
- locale settings

## Architecture

```text
Browser
  -> Cloudflare
      -> Astro storefront / Worker
          -> CMS content adapter
              -> D1
          -> media URLs
              -> R2
          -> inquiry cart
              -> WhatsApp wa.me

Admin
  -> EmDash Admin
      -> authentication / RBAC
      -> D1 content
      -> R2 media
```

## Authentication decision

The user explicitly does not want GitHub login. EmDash's native authentication is the preferred first implementation because it integrates with its session/RBAC model. If username/password is required, implement it through a supported custom auth provider rather than bypassing EmDash sessions with an ad-hoc cookie system.

## Deployment stages

1. Build/CI verification of the refactor branch.
2. Provision Cloudflare D1 and R2 for a preview environment.
3. Validate CMS CRUD and media upload.
4. Migrate existing products into D1.
5. Switch storefront reads to the CMS adapter.
6. Validate inquiry cart and WhatsApp links.
7. Validate SEO, sitemap, canonical and hreflang.
8. Run production build and smoke tests.
9. Attach the production domain only after preview acceptance.
10. Keep the old branch available for rollback.

## Acceptance criteria

- Admin can create/edit/publish a product without code changes.
- Admin can upload multiple high-resolution images.
- Product pages render CMS content and responsive media.
- Homepage sections can be edited without code changes.
- Inquiry cart persists locally and sends product name, SKU, quantity and URL to WhatsApp.
- No public admin route requires GitHub login.
- No production secret is committed to Git.
- Lighthouse/SEO basics remain intact after migration.
- Existing production site remains unchanged until cutover.
