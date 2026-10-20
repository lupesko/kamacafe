import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CANONICAL_ORIGIN = 'https://kamacafe.lupesko.com';
export const WORKER_NAME = 'kamacafe';
export const MAX_ASSET_FILES = 20_000;
export const MAX_ASSET_BYTES = 25 * 1024 * 1024;
export const MAX_HEADER_RULES = 100;
export const MAX_HEADER_LINE_LENGTH = 2_000;

export interface ArtifactFile {
  path: string;
  size: number;
}

export interface DeploymentConfigValidationInput {
  config: Record<string, unknown>;
  headers: string;
  assetFiles: ArtifactFile[];
  activeFiles?: Record<string, string>;
}

interface HeaderRule {
  pattern: string;
  headers: Map<string, string>;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseHeaderRules(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let current: HeaderRule | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!/^\s/.test(rawLine)) {
      current = { pattern: trimmed, headers: new Map() };
      rules.push(current);
      continue;
    }
    if (!current) continue;
    const separator = trimmed.indexOf(':');
    if (separator <= 0) continue;
    current.headers.set(trimmed.slice(0, separator).toLowerCase(), trimmed.slice(separator + 1).trim());
  }
  return rules;
}

function headerValue(rules: HeaderRule[], pattern: string, name: string): string | undefined {
  return rules.find((rule) => rule.pattern === pattern)?.headers.get(name.toLowerCase());
}

function containsCredentialMaterial(text: string): boolean {
  const withoutExpressions = text.replace(/\$\{\{[\s\S]*?\}\}/g, '');
  return [
    /AKIA[0-9A-Z]{16}/,
    /ASIA[0-9A-Z]{16}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /(?:CLOUDFLARE_API_TOKEN|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*["']?(?!\s*$)[A-Za-z0-9_\-]{20,}/i,
  ].some((pattern) => pattern.test(withoutExpressions));
}

export function collectDeploymentConfigErrors(input: DeploymentConfigValidationInput): string[] {
  const errors: string[] = [];
  const config = input.config;
  const assets = objectValue(config.assets);
  const routes = Array.isArray(config.routes) ? config.routes.map(objectValue) : [];

  if (config.name !== WORKER_NAME) errors.push(`Worker name must be ${WORKER_NAME}.`);
  if (typeof config.compatibility_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(config.compatibility_date)) {
    errors.push('compatibility_date must be a fixed YYYY-MM-DD value.');
  }
  if (config.workers_dev !== false) errors.push('workers_dev must be false.');
  if (config.preview_urls !== true) errors.push('preview_urls must be true.');
  if ('main' in config) errors.push('Static hosting must not define a main runtime entry point.');
  if (assets.directory !== './dist' && assets.directory !== 'dist') errors.push('assets.directory must be ./dist.');
  if (assets.not_found_handling !== 'none') errors.push('assets.not_found_handling must be none.');
  if ('binding' in assets) errors.push('Static hosting must not define an asset binding.');
  if ('run_worker_first' in assets) errors.push('Static hosting must not run Worker code before assets.');
  if (!routes.some((route) => route.pattern === 'kamacafe.lupesko.com' && route.custom_domain === true)) {
    errors.push('The exact kamacafe.lupesko.com Custom Domain must be configured.');
  }

  if (input.assetFiles.length > MAX_ASSET_FILES) {
    errors.push(`Static artifact exceeds the ${MAX_ASSET_FILES.toLocaleString('en-US')} file limit.`);
  }
  for (const file of input.assetFiles) {
    if (!Number.isFinite(file.size) || file.size < 0) errors.push(`${file.path} has an invalid file size.`);
    if (file.size > MAX_ASSET_BYTES) errors.push(`${file.path} exceeds the 25 MiB per-file limit.`);
  }

  const lines = input.headers.split(/\r?\n/);
  if (lines.some((line) => line.length > MAX_HEADER_LINE_LENGTH)) {
    errors.push('_headers contains a line longer than 2,000 characters.');
  }
  const rules = parseHeaderRules(input.headers);
  if (rules.length > MAX_HEADER_RULES) errors.push('_headers exceeds 100 header rules.');

  const globalRequired: Record<string, RegExp> = {
    'x-content-type-options': /^nosniff$/i,
    'x-frame-options': /^DENY$/i,
    'referrer-policy': /^(?:no-referrer|strict-origin-when-cross-origin)$/i,
    'permissions-policy': /camera=\(\).*microphone=\(\).*geolocation=\(\)/i,
  };
  for (const [name, expected] of Object.entries(globalRequired)) {
    const value = headerValue(rules, '/*', name);
    if (!value || !expected.test(value)) errors.push(`_headers must set ${name} on /*.`);
  }

  for (const pattern of ['/', '/index.html']) {
    const cache = headerValue(rules, pattern, 'cache-control');
    if (!cache || !/max-age=0/i.test(cache) || !/must-revalidate/i.test(cache)) {
      errors.push(`${pattern} must use browser revalidation.`);
    }
  }
  const assetCache = headerValue(rules, '/assets/*', 'cache-control');
  if (!assetCache || !/max-age=31536000/i.test(assetCache) || !/immutable/i.test(assetCache)) {
    errors.push('/assets/* must use a one-year immutable browser cache.');
  }
  const imageCache = headerValue(rules, '/images/*', 'cache-control');
  if (!imageCache || !/max-age=86400/i.test(imageCache) || /immutable/i.test(imageCache)) {
    errors.push('/images/* must use a finite one-day browser cache.');
  }
  const noindex = headerValue(rules, 'https://:version.:subdomain.workers.dev/*', 'x-robots-tag');
  if (!noindex || !/\bnoindex\b/i.test(noindex)) {
    errors.push('Version URLs must match the documented workers.dev pattern and send X-Robots-Tag: noindex.');
  }

  for (const [path, text] of Object.entries(input.activeFiles ?? {})) {
    if (/(?:aws-actions\/configure-aws-credentials|hashicorp\/setup-terraform|\bterraform\s+(?:init|fmt|validate|plan|apply|destroy)\b|\baws\s+s3\b|s3:\/\/|(?:^|[\s`])infra\/)/im.test(text)) {
      errors.push(`${path} contains a legacy deployment dependency.`);
    }
    if (containsCredentialMaterial(text)) errors.push(`${path} appears to contain credential material.`);
  }

  return errors;
}

function artifactFiles(root: string): ArtifactFile[] {
  const files: ArtifactFile[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push({ path: relative(root, absolute), size: statSync(absolute).size });
    }
  };
  visit(root);
  return files;
}

export function validateRepositoryDeployment(root = process.cwd()): { files: number; bytes: number; rules: number } {
  const config = JSON.parse(readFileSync(resolve(root, 'wrangler.jsonc'), 'utf8')) as Record<string, unknown>;
  const headers = readFileSync(resolve(root, 'public/_headers'), 'utf8');
  const dist = resolve(root, 'dist');
  const files = artifactFiles(dist);
  const activePaths = [
    '.github/workflows/ci.yml',
    '.github/workflows/deploy.yml',
    '.github/workflows/rollback.yml',
    'README.md',
    'CONTRIBUTING.md',
  ];
  const activeFiles: Record<string, string> = {};
  for (const path of activePaths) {
    try {
      activeFiles[path] = readFileSync(resolve(root, path), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const errors = collectDeploymentConfigErrors({ config, headers, assetFiles: files, activeFiles });
  if (errors.length) throw new Error(`Invalid deployment configuration:\n- ${errors.join('\n- ')}`);
  return {
    files: files.length,
    bytes: files.reduce((total, file) => total + file.size, 0),
    rules: parseHeaderRules(headers).length,
  };
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  try {
    const result = validateRepositoryDeployment();
    console.log(`Deployment configuration valid: ${result.files} files, ${result.bytes} bytes, ${result.rules} header rules.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
