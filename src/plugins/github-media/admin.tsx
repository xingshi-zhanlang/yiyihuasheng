import React, { useEffect, useState } from 'react';
import { usePluginAPI } from '@emdash-cms/admin';

interface Status {
  configured: boolean;
  owner?: string;
  repo?: string;
  branch?: string;
  tokenSet: boolean;
}

export const pages = {
  '/upload': function MediaUploadPage() {
    const api = usePluginAPI();
    const [status, setStatus] = useState<Status | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('content: add site media');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<string>('');

    useEffect(() => {
      api.get('status').then((response) => setStatus((response as { data?: Status }).data ?? (response as Status)));
    }, []);

    async function upload() {
      if (!file) return;
      setBusy(true);
      setResult('');
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('Free mode supports images up to 5 MiB.');
        if (!/^image\/(png|jpeg|webp|avif|gif)$/i.test(file.type)) throw new Error('Unsupported image type.');

        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        const contentBase64 = btoa(binary);
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
        const path = `images/uploads/${Date.now()}-${safeName}`;
        const response = await api.post('upload', { path, contentBase64, message });
        const data = (response as { data?: { url?: string } }).data ?? (response as { url?: string });
        setResult(`Uploaded: ${data.url ?? `/${path}`}`);
        setFile(null);
      } catch (error) {
        setResult(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setBusy(false);
      }
    }

    return (
      <div style={{ maxWidth: 840, padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Media Upload</h1>
        <p style={{ marginTop: 8, lineHeight: 1.6 }}>
          Zero-cost mode stores catalog media in GitHub under <code>public/</code>. Each upload creates a repository commit and Workers Builds publishes it as a Static Asset.
        </p>

        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <strong>Connection</strong>
          <p style={{ marginTop: 8 }}>
            {status?.configured
              ? `Connected to ${status.owner}/${status.repo} (${status.branch})`
              : 'Not configured. Open this plugin’s Settings and add GitHub Owner, Repository, Branch and a fine-grained Contents: write token.'}
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={{ display: 'block', fontWeight: 600 }}>Image</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            style={{ marginTop: 8 }}
          />
          {file && <div style={{ marginTop: 8 }}>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MiB</div>}
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'block', fontWeight: 600 }}>Commit message</label>
          <input value={message} onChange={(event) => setMessage(event.target.value)} style={{ marginTop: 8, width: '100%', padding: 10 }} />
        </div>

        <button type="button" onClick={upload} disabled={!file || busy || !status?.configured} style={{ marginTop: 20, padding: '10px 18px', borderRadius: 10 }}>
          {busy ? 'Uploading…' : 'Upload to Static Assets'}
        </button>

        {result && <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 10 }}>{result}</div>}
      </div>
    );
  },
};

export const widgets = {};
