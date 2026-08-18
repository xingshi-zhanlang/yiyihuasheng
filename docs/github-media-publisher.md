# Zero-cost media publishing

The site can publish catalog media without Cloudflare R2 by storing images in the repository's `public/images/uploads/` directory and serving them as Worker Static Assets.

The EmDash **GitHub Media** plugin keeps the GitHub credential inside EmDash's secret settings and exposes an authenticated admin page at the plugin's `Media Upload` entry.

## GitHub token

Create a fine-grained personal access token restricted to this repository with **Contents: Read and write**. Do not grant workflow permissions and do not use a classic PAT with broad `repo` scope.

In EmDash → Plugins → GitHub Media → Settings, set:

- GitHub Owner: `xingshi-zhanlang`
- GitHub Repository: `yiyihuasheng`
- Git Branch: `main`
- GitHub Fine-grained Token: the token value

The token is stored as a secret setting and is only used server-side. The browser receives neither the token nor the GitHub API response headers.

## Upload behaviour

Uploads are committed to `public/images/uploads/` and therefore become Worker Static Assets on the next Workers Build. The current free-mode uploader accepts PNG, JPEG, WebP, AVIF, and GIF files up to 5 MiB. Keep production catalog media optimised for web delivery; files above GitHub's most capable Contents API range should be resized or converted before upload.

Each upload creates a Git commit. Workers Builds then publishes the new asset automatically from `main`.
