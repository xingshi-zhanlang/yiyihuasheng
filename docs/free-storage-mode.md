# Free storage mode

HiDREAM can run without Cloudflare R2.

- Product/content data: Cloudflare D1.
- Catalog/site media: Worker Static Assets committed under `public/images`.
- CMS image fields can reference public paths such as `/images/products/...`.
- No R2 bucket or `MEDIA` Worker binding is required.

## Important limitation

EmDash requires a storage adapter. Its documented persistent media option on Cloudflare Workers is R2; local filesystem storage is intended for development/single-server deployments and is not durable on Workers. Therefore this zero-cost mode supports existing/static media paths, but durable drag-and-drop CMS media uploads are not yet provided.

The next zero-cost enhancement is a GitHub-backed media publisher: an authenticated admin upload can create/update an asset in the repository and trigger a Workers Build. This keeps media in Git/Static Assets without requiring R2.
