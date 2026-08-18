import { definePlugin } from 'emdash';
import type { PluginDescriptor } from 'emdash';
import { z } from 'astro/zod';

const id = 'github-media';
const version = '0.1.1';
const adminEntry = './src/plugins/github-media/admin.tsx';
const entrypoint = './src/plugins/github-media/index.ts';

type PluginKv = {
  get: (key: string) => Promise<string | undefined>;
};

async function getSetting(ctx: { kv: PluginKv }, key: string): Promise<string | undefined> {
  return ctx.kv.get(key);
}

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

async function githubRequest(ctx: { kv: PluginKv; http: { fetch: (url: string, init?: RequestInit) => Promise<Response> } }, url: string, init: RequestInit = {}) {
  const token = await getSetting(ctx, 'settings:githubToken');
  if (!token) throw new Error('GitHub token is not configured');

  return ctx.http.fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
}

export function createPlugin() {
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
          description: 'Contents: read/write on this repository only.',
        },
      },
      pages: [{ path: '/upload', label: 'Media Upload', icon: 'image' }],
    },
    routes: {
      status: {
        handler: async (ctx) => {
          const owner = await getSetting(ctx, 'settings:githubOwner');
          const repo = await getSetting(ctx, 'settings:githubRepo');
          const branch = (await getSetting(ctx, 'settings:githubBranch')) || 'main';
          const tokenSet = Boolean(await getSetting(ctx, 'settings:githubToken'));
          return { configured: Boolean(owner && repo && tokenSet), owner, repo, branch, tokenSet };
        },
      },
      upload: {
        input: z.object({
          path: z.string().min(1).max(240),
          contentBase64: z.string().min(16).max(7_000_000),
          message: z.string().min(1).max(140).default('content: add site media'),
        }),
        handler: async (ctx) => {
          const { path: inputPath, contentBase64: rawBase64, message } = ctx.input as {
            path: string;
            contentBase64: string;
            message: string;
          };

          const owner = await getSetting(ctx, 'settings:githubOwner');
          const repo = await getSetting(ctx, 'settings:githubRepo');
          const branch = (await getSetting(ctx, 'settings:githubBranch')) || 'main';
          if (!owner || !repo || !(await getSetting(ctx, 'settings:githubToken'))) {
            throw new Response('GitHub media settings are incomplete', { status: 503 });
          }

          const path = safePath(inputPath);
          assertImageName(path);
          const contentBase64 = rawBase64.replace(/\s/g, '');
          if (base64Bytes(contentBase64) > 5 * 1024 * 1024) {
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
              message,
              content: contentBase64,
              branch,
              ...(sha ? { sha } : {}),
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`GitHub upload failed (${response.status}): ${text.slice(0, 300)}`);
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

export default createPlugin;
