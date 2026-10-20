import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CANONICAL_ORIGIN } from './validate-deployment-config';

export type VerificationFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface DeploymentVersion {
  version_id?: unknown;
  percentage?: unknown;
}

interface Deployment {
  created_on?: unknown;
  versions?: DeploymentVersion[];
}

export interface ProductionVerificationInput {
  hostname: string;
  expectedVersionId: string;
  fetch?: VerificationFetch;
  loadDeployments: () => Promise<unknown>;
  retries?: number;
  retryDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
}

export interface ProductionVerificationResult {
  hostname: string;
  versionId: string;
  imageWidth: number;
  imageHeight: number;
  hashRoutes: number;
  verifiedAt: string;
}

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function assertResponse(response: Response, message: string): void {
  if (!response.ok) throw new Error(`${message}: expected success, received HTTP ${response.status}.`);
}

function requireHeader(response: Response, name: string, expected: RegExp): string {
  const value = response.headers.get(name) ?? '';
  if (!expected.test(value)) throw new Error(`${name} did not match the production contract.`);
  return value;
}

export function parseActiveDeployment(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) throw new Error('Wrangler returned no deployments.');
  const deployments = [...(value as Deployment[])].sort((left, right) =>
    String(left.created_on ?? '').localeCompare(String(right.created_on ?? '')),
  );
  const active = deployments.at(-1);
  if (!active || !Array.isArray(active.versions)) throw new Error('Latest deployment has no version assignments.');
  const fullTraffic = active.versions.filter((version) => Number(version.percentage) === 100);
  if (active.versions.length !== 1 || fullTraffic.length !== 1) {
    throw new Error('Latest deployment must assign exactly one version at 100% traffic.');
  }
  const versionId = fullTraffic[0].version_id;
  if (typeof versionId !== 'string' || !versionId.trim()) throw new Error('Latest deployment has no valid active version ID.');
  return versionId;
}

function assertCanonicalHtml(html: string, origin: string): string {
  for (const expected of [
    `<link rel="canonical" href="${origin}/"`,
    `<meta property="og:url" content="${origin}/"`,
    `<meta property="og:image" content="${origin}/images/social-preview.png"`,
  ]) {
    if (!html.includes(expected)) throw new Error(`Production HTML is missing canonical metadata: ${expected}.`);
  }
  const asset = html.match(/(?:src|href)=["'](\/assets\/[^"']+)["']/)?.[1];
  if (!asset) throw new Error('Production HTML does not reference a content-addressed asset.');
  return asset;
}

async function verifyOnce(input: ProductionVerificationInput): Promise<ProductionVerificationResult> {
  const fetcher = input.fetch ?? fetch;
  const origin = `https://${input.hostname}`;
  if (origin !== CANONICAL_ORIGIN) throw new Error(`Hostname must identify ${CANONICAL_ORIGIN}.`);

  let assetPath = '';
  const hashRoutes = ['#category-espresso-drink', '#espresso'];
  for (const route of ['', ...hashRoutes]) {
    const response = await fetcher(`${origin}/${route}`, { redirect: 'follow', cache: 'no-store' });
    assertResponse(response, `Production route /${route}`);
    requireHeader(response, 'content-type', /^text\/html\b/i);
    const html = await response.text();
    const observedAsset = assertCanonicalHtml(html, origin);
    assetPath ||= observedAsset;
    if (route === '') {
      requireHeader(response, 'cache-control', /max-age=0.*must-revalidate|must-revalidate.*max-age=0/i);
      requireHeader(response, 'x-content-type-options', /^nosniff$/i);
      requireHeader(response, 'x-frame-options', /^DENY$/i);
      requireHeader(response, 'referrer-policy', /^(?:no-referrer|strict-origin-when-cross-origin)$/i);
      requireHeader(response, 'permissions-policy', /camera=\(\).*microphone=\(\).*geolocation=\(\)/i);
    }
  }

  const redirectPath = '/redirect-check?source=kamacafe';
  const redirect = await fetcher(`http://${input.hostname}${redirectPath}`, { redirect: 'manual', cache: 'no-store' });
  if (![301, 302, 307, 308].includes(redirect.status)) throw new Error(`HTTP redirect returned ${redirect.status}.`);
  if (redirect.headers.get('location') !== `${origin}${redirectPath}`) {
    throw new Error('HTTP redirect did not preserve the canonical hostname, path, and query.');
  }

  const missing = await fetcher(`${origin}/__kamacafe_missing__`, { redirect: 'manual', cache: 'no-store' });
  if (missing.status !== 404) throw new Error(`Missing real path must return 404, received ${missing.status}.`);

  const asset = await fetcher(`${origin}${assetPath}`, { redirect: 'follow', cache: 'no-store' });
  assertResponse(asset, 'Content-addressed asset');
  requireHeader(asset, 'content-type', /(?:javascript|css)/i);
  requireHeader(asset, 'cache-control', /max-age=31536000.*immutable|immutable.*max-age=31536000/i);

  const image = await fetcher(`${origin}/images/social-preview.png`, { redirect: 'follow', cache: 'no-store' });
  assertResponse(image, 'Social preview image');
  requireHeader(image, 'content-type', /^image\/png\b/i);
  requireHeader(image, 'cache-control', /max-age=86400/i);
  const bytes = Buffer.from(await image.arrayBuffer());
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature) || bytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('Social preview image is not a valid PNG.');
  }
  const imageWidth = bytes.readUInt32BE(16);
  const imageHeight = bytes.readUInt32BE(20);
  if (imageWidth !== 1200 || imageHeight !== 630) throw new Error(`Social preview image must be 1200x630, got ${imageWidth}x${imageHeight}.`);

  const activeVersion = parseActiveDeployment(await input.loadDeployments());
  if (activeVersion !== input.expectedVersionId) {
    throw new Error(`Active version ${activeVersion} does not match expected version ${input.expectedVersionId}.`);
  }

  return {
    hostname: input.hostname,
    versionId: activeVersion,
    imageWidth,
    imageHeight,
    hashRoutes: hashRoutes.length,
    verifiedAt: new Date().toISOString(),
  };
}

export async function verifyProductionDeployment(input: ProductionVerificationInput): Promise<ProductionVerificationResult> {
  const retries = input.retries ?? 5;
  const retryDelayMs = input.retryDelayMs ?? 10_000;
  const sleep = input.sleep ?? ((milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)));
  if (!Number.isInteger(retries) || retries < 1 || retries > 10) throw new Error('Retries must be an integer from 1 through 10.');

  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await verifyOnce(input);
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(retryDelayMs);
    }
  }
  throw new Error(`Production verification failed after ${retries} attempt(s): ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`Missing required argument ${name}.`);
  return value;
}

async function runCli(): Promise<void> {
  const hostname = argument('--hostname');
  const expectedVersionId = argument('--expected-version');
  const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
  const result = await verifyProductionDeployment({
    hostname,
    expectedVersionId,
    loadDeployments: async () => {
      const output = execFileSync(process.execPath, [wrangler, 'deployments', 'list', '--json'], { encoding: 'utf8' });
      return JSON.parse(output) as unknown;
    },
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
