# Free storage mode

HiDREAM's free deployment mode does not require Cloudflare R2.

- Product/content data: Cloudflare D1.
- Site and catalog media: Worker Static Assets committed to `public/`.
- CMS image fields should use public asset paths such as `/images/products/...`.
- Do not enable or bind an R2 bucket in this mode.

When media volume eventually justifies object storage, R2 can be reintroduced as a separate migration without changing the content model.
