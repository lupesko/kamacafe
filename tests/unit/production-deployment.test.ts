import { describe, expect, it, vi } from 'vitest';
import {
  parseActiveDeployment,
  verifyProductionDeployment,
  type VerificationFetch,
} from '../../scripts/verify-production-deployment';

const hostname = 'kamacafe.lupesko.com';
const versionId = '12345678-1234-4234-8234-123456789abc';
const assetPath = '/assets/index-abc123.js';

function pngHeader(width = 1200, height = 630): ArrayBuffer {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.writeUInt32BE(13, 8);
  png.write('IHDR', 12, 'ascii');
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
}

function html(origin = `https://${hostname}`): string {
  return `<!doctype html><html><head>
    <link rel="canonical" href="${origin}/">
    <meta property="og:url" content="${origin}/">
    <meta property="og:image" content="${origin}/images/social-preview.png">
    <script type="module" src="${assetPath}"></script>
  </head></html>`;
}

function deployments(activeVersion = versionId): unknown {
  return [
    {
      id: 'deployment-1',
      created_on: '2026-10-19T12:00:00.000Z',
      versions: [{ version_id: activeVersion, percentage: 100 }],
    },
  ];
}

function validFetch(overrides: Partial<Record<'html' | 'redirect' | 'missing' | 'image' | 'asset', Response>> = {}): VerificationFetch {
  return vi.fn(async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input.toString() : input.url);
    if (url.protocol === 'http:') {
      return overrides.redirect ?? new Response(null, { status: 308, headers: { location: `https://${hostname}${url.pathname}${url.search}` } });
    }
    if (url.pathname === '/__kamacafe_missing__') return overrides.missing ?? new Response('missing', { status: 404 });
    if (url.pathname === '/images/social-preview.png') {
      return overrides.image ?? new Response(pngHeader(), { status: 200, headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
    }
    if (url.pathname === assetPath) {
      return overrides.asset ?? new Response('export{}', { status: 200, headers: { 'content-type': 'text/javascript', 'cache-control': 'public, max-age=31536000, immutable' } });
    }
    return overrides.html ?? new Response(html(), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      },
    });
  });
}

describe('production deployment verification', () => {
  it('verifies canonical metadata, hash routes, redirect, 404, headers, image, and active version', async () => {
    const result = await verifyProductionDeployment({
      hostname,
      expectedVersionId: versionId,
      fetch: validFetch(),
      loadDeployments: async () => deployments(),
      retries: 1,
    });
    expect(result).toMatchObject({ hostname, versionId, imageWidth: 1200, imageHeight: 630, hashRoutes: 2 });
  });

  it('extracts only a single 100% active version from the latest deployment', () => {
    expect(parseActiveDeployment(deployments())).toBe(versionId);
    expect(() => parseActiveDeployment([{ created_on: '2026-10-19T12:00:00Z', versions: [{ version_id: versionId, percentage: 50 }] }])).toThrow(/100%/i);
  });

  it.each([
    ['canonical origin', { html: new Response(html('https://wrong.example.com'), { status: 200, headers: { 'content-type': 'text/html', 'cache-control': 'max-age=0, must-revalidate', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'strict-origin-when-cross-origin', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' } }) }],
    ['HTTP redirect', { redirect: new Response(null, { status: 308, headers: { location: 'https://wrong.example.com/' } }) }],
    ['real-path 404', { missing: new Response('oops', { status: 200 }) }],
    ['image MIME', { image: new Response(pngHeader(), { status: 200, headers: { 'content-type': 'image/jpeg', 'cache-control': 'max-age=86400' } }) }],
    ['image dimensions', { image: new Response(pngHeader(1199, 630), { status: 200, headers: { 'content-type': 'image/png', 'cache-control': 'max-age=86400' } }) }],
    ['immutable asset cache', { asset: new Response('export{}', { status: 200, headers: { 'content-type': 'text/javascript', 'cache-control': 'max-age=60' } }) }],
  ])('rejects an invalid %s contract', async (_name, overrides) => {
    await expect(verifyProductionDeployment({ hostname, expectedVersionId: versionId, fetch: validFetch(overrides), loadDeployments: async () => deployments(), retries: 1 })).rejects.toThrow();
  });

  it('retries bounded propagation failures and then succeeds', async () => {
    let attempt = 0;
    const sleep = vi.fn(async () => undefined);
    await expect(verifyProductionDeployment({
      hostname,
      expectedVersionId: versionId,
      fetch: validFetch(),
      loadDeployments: async () => deployments(++attempt === 1 ? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' : versionId),
      retries: 2,
      retryDelayMs: 1,
      sleep,
    })).resolves.toMatchObject({ versionId });
    expect(sleep).toHaveBeenCalledTimes(1);
  });
});
