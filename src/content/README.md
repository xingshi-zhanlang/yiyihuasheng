# CMS content adapter boundary

The storefront should consume a stable product/content shape from `src/lib/content` rather than importing CMS SDK calls directly into page components.

This boundary lets the site run against fixture/local data during development and switch to EmDash/D1 at deployment without rewriting the UI.

Planned adapters:

- `fixture` — current repository data for safe migration and preview
- `emdash` — production CMS/D1 adapter

Do not put credentials or Cloudflare bindings in this directory.