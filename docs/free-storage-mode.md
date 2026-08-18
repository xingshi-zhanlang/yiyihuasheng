# Free storage mode

HiDREAM's free deployment mode does not require Cloudflare R2.

- Product/content data: Cloudflare D1.
- Site and catalog media: Worker Static Assets committed to `public/`.
- CMS image fields use public asset paths such as `/images/products/...`.
- No R2 bucket or `MEDIA` binding is required.

When media volume eventually justifies object storage, R2 can be reintroduced as a separate migration without changing the product content model.
