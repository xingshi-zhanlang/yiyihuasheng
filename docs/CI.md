# CI notes

The refactor branch uses Node 22 and the current Cloudflare Workers type package compatible with Wrangler 4.122.

CI runs `npm install`, `npm run typecheck`, and `npm run build` on `refactor/**` and `main` pushes plus pull requests to `main`.
