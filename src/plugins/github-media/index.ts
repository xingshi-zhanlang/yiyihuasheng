import { definePlugin } from 'emdash';
import type { PluginDescriptor } from 'emdash';
import { z } from 'astro/zod';

const id = 'github-media';
const version = '0.1.0';
const adminEntry = './src/plugins/github-media/admin.tsx';
const entrypoint = './src/plugins/github-media/index.ts';

export function githubMediaPlugin(): PluginDescriptor {
  return {
    id,
    version,
    format: 'native',
    entrypoint,
    adminEntry,
    adminPages: [{ path: '/upload', label: 'Media Upload', icon: 'image' }],
  };
}

function safePath(input: string): string {
  const normalized = input.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || !/^images\/uploads\/[a-zA-Z0-9._/-]+$/.test(normalized)) {
    throw new Response('Invalid upload path', { status: 400 });
  }
  return normalized;
}

function assertImageName(path: string): void {
  if (!/\.(png|jpe?g|webp|avif|gif)$/i.test(path)) {
    throw new Response('Only PNG, JPG, JPEG, WebP, AVIF and GIF files are supported', { status: 400 });
  }
}

function base64Bytes(value: string): number {
  return Math.floor((value.replace(/\s/g, '').length * 3) / 4);
}

async function githubRequest(ctx: any, url: string, init: RequestInit = {}) {
  const response = await ctx.http?.fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${await ctx.kv.get<string>('settings:githubToken')}`,
      'X-GitHub-Api-Version': '2026-03-10',
      ...(init.headers || {}),
    },
  });
  if (!response) throw new Error('GitHub network capability is unavailable');
  return response;
}

export function createGithubMediaPlugin() {
  return definePlugin({
    id,
    version,
    capabilities: ['network:request'],
    allowedHosts: ['api.github.com'],
    admin: {
      entry: adminEntry,
      settingsSchema: {
        githubOwner: { type: 'string', label: 'GitHub Owner' },
        githubRepo: { type: 'string', label: 'GitHub Repository' },
        githubBranch: { type: 'string', label: 'Git Branch', default: 'main' },
        githubToken: {
          type: 'secret',
          label: 'GitHub Fine-grained Token',
          description: 'Contents: read/write on this repository only. Never paste a classic token here.',
        },
      },
      pages: [{ path: '/upload', label: 'Media Upload', icon: 'image' }],
    },
    routes: {
      status: {
        handler: async (_ctx: any, ctx: any) => {
          const owner = await ctx.kv.get<string>('settings:githubOwner');
          const repo = await ctx.kv.get<string>('settings:githubRepo');
          const branch = (await ctx.kv.get<string>('settings:githubBranch')) || 'main';
          const tokenSet = Boolean(await ctx.kv.get<string>('settings:githubToken'));
          return { configured: Boolean(owner && repo && tokenSet), owner, repo, branch, tokenSet };
        },
      },
      upload: {
        input: z.object({
          path: z.string().min(1).max(240),
          contentBase64: z.string().min(16).max(7_000_000),
          message: z.string().min(1).max(140).default('content: add site media'),
        }),
        handler: async (routeCtx: any, ctx: any) => {
          const owner = await ctx.kv.get<string>('settings:githubOwner');
          const repo = await ctx.kv.get<string>('settings:githubRepo');
          const branch = (await ctx.kv.get<string>('settings:githubBranch')) || 'main';
          const token = await ctx.kv.get<string>('settings:githubToken');
          if (!owner || !repo || !token) throw new Response('GitHub media settings are incomplete', { status: 503 });

          const path = safePath(routeCtx.input.path);
          assertImageName(path);
          const contentBase64 = routeCtx.input.contentBase64.replace(/\s/g, '');
          const bytes = base64Bytes(contentBase64);
          if (bytes > 5 * 1024 * 1024) {
            throw new Response('Image must be 5 MiB or smaller in free mode', { status: 413 });
          }

          const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
            .split('/')
            .map(encodeURIComponent)
            .join('/')}`;

          let sha: string | undefined;
          const existing = await githubRequest(ctx, `${apiUrl}?ref=${encodeURIComponent(branch)}`);
          if (existing.ok) {
            const existingJson = (await existing.json()) as { sha?: string };
            sha = existingJson.sha;
          } else if (existing.status !== 404) {
            throw new Error(`GitHub lookup failed (${existing.status})`);
          }

          const response = await githubRequest(ctx, apiUrl, {
            method: 'PUT',
            body: JSON.stringify({
              message: routeCtx.input.message,
              content: contentBase64,
              branch,
              ...(sha ? { sha } : {}),
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            ctx.log.warn('GitHub media upload failed', { status: response.status, body: text.slice(0, 500) });
            throw new Error(`GitHub upload failed (${response.status})`);
          }

          return {
            ok: true,
            path,
            url: `/${path}`,
            commit: (await response.json()) as unknown,
          };
        },
      },
    },
  });
}

export default githubMediaPlugin;
