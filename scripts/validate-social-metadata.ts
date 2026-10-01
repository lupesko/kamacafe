import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SOCIAL_TITLE = 'KamaCafé — Brew the perfect cup';
export const SOCIAL_DESCRIPTION = 'Clear guides for brewing the perfect coffee.';
export const SOCIAL_IMAGE_ALT = 'KamaCafé coffee brewing guides with illustrated coffee drinks';
export const SOCIAL_IMAGE_PATH = '/images/social-preview.png';
export const TEST_SITE_URL = 'https://preview.kamacafe.test';

const expectedImageWidth = 1200;
const expectedImageHeight = 630;
const maximumImageBytes = 1024 * 1024;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

interface Tag {
  attributes: Record<string, string>;
  index: number;
  raw: string;
}

export interface SocialMetadataValidationInput {
  html: string;
  image: Uint8Array;
  production?: boolean;
}

export interface SocialMetadataValidationResult {
  siteUrl: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}

function parseAttributes(raw: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=/>]+)\s*=\s*(["'])(.*?)\2/g;
  for (const match of raw.matchAll(pattern)) attributes[match[1].toLowerCase()] = match[3];
  return attributes;
}

function collectTags(html: string, name: string): Tag[] {
  const tags: Tag[] = [];
  const pattern = new RegExp(`<${name}\\b[^>]*>`, 'gi');
  for (const match of html.matchAll(pattern)) {
    tags.push({
      attributes: parseAttributes(match[0]),
      index: match.index ?? -1,
      raw: match[0],
    });
  }
  return tags;
}

function isInsideHead(index: number, headStart: number, headEnd: number): boolean {
  return index > headStart && index < headEnd;
}

function privateOrLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized.endsWith('.home.arpa') ||
    normalized === '::' ||
    normalized === '::1'
  ) {
    return true;
  }
  if (/^(?:fc|fd|fe8|fe9|fea|feb|ff)[0-9a-f:]*$/i.test(normalized)) return true;
  if (/^2001:db8(?::|$)/i.test(normalized)) return true;

  const ipv4 = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return true;
  const [first, second, third] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
}

function placeholderHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    ['example.com', 'example.net', 'example.org'].includes(normalized) ||
    normalized.endsWith('.example') ||
    normalized.endsWith('.invalid') ||
    (normalized.endsWith('.test') && normalized !== new URL(TEST_SITE_URL).hostname) ||
    /(placeholder|replace|changeme|real[-_.]?production)/.test(normalized)
  );
}

function validateSiteRoot(value: string, production: boolean, errors: string[]): URL | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    errors.push('canonical URL must be an absolute URL');
    return undefined;
  }

  if (url.protocol !== 'https:') errors.push('canonical URL must use HTTPS');
  if (url.username || url.password) errors.push('canonical URL must not contain credentials');
  if (url.port) errors.push('canonical URL must not contain a non-default port');
  if (url.pathname !== '/' || url.search || url.hash) {
    errors.push('canonical URL must be an origin root without a path, query, or fragment');
  }
  if (placeholderHostname(url.hostname)) errors.push('canonical URL must not use a placeholder or reserved hostname');
  if (production) {
    if (url.origin === TEST_SITE_URL || url.hostname.endsWith('.test')) {
      errors.push('production canonical URL must not use the non-production .test fixture');
    }
    if (privateOrLocalHostname(url.hostname)) {
      errors.push('production canonical URL must not use a local or private hostname');
    }
  }
  return url;
}

function readPngDimensions(image: Uint8Array, errors: string[]): { width: number; height: number } {
  const bytes = Buffer.from(image);
  if (bytes.length > maximumImageBytes) errors.push('social preview PNG must be at most 1 MB');
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) {
    errors.push('social preview image must have a valid PNG signature');
    return { width: 0, height: 0 };
  }
  if (bytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
    errors.push('social preview PNG must begin with an IHDR chunk');
    return { width: 0, height: 0 };
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== expectedImageWidth || height !== expectedImageHeight) {
    errors.push(`social preview PNG must be exactly ${expectedImageWidth}x${expectedImageHeight}, got ${width}x${height}`);
  }
  return { width, height };
}

export function validateSocialMetadata({
  html,
  image,
  production = false,
}: SocialMetadataValidationInput): SocialMetadataValidationResult {
  const errors: string[] = [];
  const headStart = html.search(/<head\b[^>]*>/i);
  const headEnd = html.search(/<\/head>/i);
  const moduleScript = html.search(/<script\b[^>]*\btype\s*=\s*["']module["']/i);
  if (headStart < 0 || headEnd < 0 || headEnd <= headStart) errors.push('document must contain one valid head element');
  if (moduleScript < 0) errors.push('document must contain a module script after the metadata');
  if (/%VITE_[A-Z0-9_]+%/i.test(html)) errors.push('built HTML contains an unresolved Vite token');

  const metas = collectTags(html, 'meta');
  const links = collectTags(html, 'link');
  const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => ({
    content: match[1].trim(),
    index: match.index ?? -1,
  }));

  const requireMeta = (selector: 'name' | 'property', key: string, expected?: string): string => {
    const matches = metas.filter(({ attributes }) => attributes[selector]?.toLowerCase() === key.toLowerCase());
    if (matches.length !== 1) {
      errors.push(`${selector}=${key} must appear exactly once, found ${matches.length}`);
      return matches[0]?.attributes.content ?? '';
    }
    const [{ attributes, index }] = matches;
    if (!isInsideHead(index, headStart, headEnd)) errors.push(`${selector}=${key} must appear inside the initial head`);
    if (moduleScript >= 0 && index > moduleScript) errors.push(`${selector}=${key} must appear before the module script`);
    const content = attributes.content ?? '';
    if (expected !== undefined && content !== expected) {
      errors.push(`${selector}=${key} must equal ${JSON.stringify(expected)}`);
    }
    return content;
  };

  if (titles.length !== 1) errors.push(`title must appear exactly once, found ${titles.length}`);
  else {
    if (!isInsideHead(titles[0].index, headStart, headEnd)) errors.push('title must appear inside the initial head');
    if (moduleScript >= 0 && titles[0].index > moduleScript) errors.push('title must appear before the module script');
    if (titles[0].content !== SOCIAL_TITLE) errors.push(`title must equal ${JSON.stringify(SOCIAL_TITLE)}`);
  }

  requireMeta('name', 'description', SOCIAL_DESCRIPTION);
  requireMeta('property', 'og:type', 'website');
  requireMeta('property', 'og:locale', 'en_US');
  requireMeta('property', 'og:site_name', 'KamaCafé');
  requireMeta('property', 'og:title', SOCIAL_TITLE);
  requireMeta('property', 'og:description', SOCIAL_DESCRIPTION);
  const ogUrl = requireMeta('property', 'og:url');
  const imageUrl = requireMeta('property', 'og:image');
  requireMeta('property', 'og:image:type', 'image/png');
  requireMeta('property', 'og:image:width', String(expectedImageWidth));
  requireMeta('property', 'og:image:height', String(expectedImageHeight));
  requireMeta('property', 'og:image:alt', SOCIAL_IMAGE_ALT);
  requireMeta('name', 'twitter:card', 'summary_large_image');
  requireMeta('name', 'twitter:image:alt', SOCIAL_IMAGE_ALT);

  for (const duplicateKey of ['twitter:title', 'twitter:description', 'twitter:image']) {
    const count = metas.filter(({ attributes }) => attributes.name?.toLowerCase() === duplicateKey).length;
    if (count) errors.push(`${duplicateKey} must be omitted so Open Graph remains the single content source`);
  }

  const canonicalLinks = links.filter(({ attributes }) => attributes.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicalLinks.length !== 1) errors.push(`canonical link must appear exactly once, found ${canonicalLinks.length}`);
  const canonical = canonicalLinks[0]?.attributes.href ?? '';
  if (canonicalLinks[0] && !isInsideHead(canonicalLinks[0].index, headStart, headEnd)) {
    errors.push('canonical link must appear inside the initial head');
  }
  if (canonicalLinks[0] && moduleScript >= 0 && canonicalLinks[0].index > moduleScript) {
    errors.push('canonical link must appear before the module script');
  }
  if (ogUrl !== canonical) errors.push('og:url must match the canonical link');

  const site = validateSiteRoot(canonical, production, errors);
  if (site && ogUrl && ogUrl !== site.href) errors.push('og:url must be the canonical origin with one trailing slash');

  let parsedImage: URL | undefined;
  try {
    parsedImage = new URL(imageUrl);
  } catch {
    errors.push('og:image must be an absolute URL');
  }
  if (parsedImage) {
    if (parsedImage.protocol !== 'https:') errors.push('og:image must use HTTPS');
    if (parsedImage.username || parsedImage.password || parsedImage.port || parsedImage.search || parsedImage.hash) {
      errors.push('og:image must not contain credentials, a port, query, or fragment');
    }
    if (site && parsedImage.origin !== site.origin) errors.push('og:image must use the canonical site origin');
    if (parsedImage.pathname !== SOCIAL_IMAGE_PATH) errors.push(`og:image must use ${SOCIAL_IMAGE_PATH}`);
  }

  const dimensions = readPngDimensions(image, errors);
  if (errors.length) throw new Error(`Invalid social metadata:\n- ${errors.join('\n- ')}`);

  return {
    siteUrl: site!.origin,
    imageUrl: parsedImage!.href,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
  };
}

export function validateBuiltSocialMetadata(root = process.cwd(), production = false): SocialMetadataValidationResult {
  const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
  const image = readFileSync(resolve(root, `dist${SOCIAL_IMAGE_PATH}`));
  return validateSocialMetadata({ html, image, production });
}

function runCli(): void {
  const unknown = process.argv.slice(2).filter((argument) => argument !== '--production');
  if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  const result = validateBuiltSocialMetadata(process.cwd(), process.argv.includes('--production'));
  console.log(
    `Validated social metadata for ${result.siteUrl} with ${result.imageWidth}x${result.imageHeight} preview image.`,
  );
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
