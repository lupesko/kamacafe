import { describe, expect, it } from 'vitest';
import {
  SOCIAL_DESCRIPTION,
  SOCIAL_IMAGE_ALT,
  SOCIAL_IMAGE_PATH,
  SOCIAL_TITLE,
  validateSocialMetadata,
} from '../../scripts/validate-social-metadata';

const siteUrl = 'https://preview.kamacafe.test';

function validHtml(origin = siteUrl): string {
  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="${SOCIAL_DESCRIPTION}" />
    <link rel="canonical" href="${origin}/" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="KamaCafé" />
    <meta property="og:title" content="${SOCIAL_TITLE}" />
    <meta property="og:description" content="${SOCIAL_DESCRIPTION}" />
    <meta property="og:url" content="${origin}/" />
    <meta property="og:image" content="${origin}${SOCIAL_IMAGE_PATH}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${SOCIAL_IMAGE_ALT}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image:alt" content="${SOCIAL_IMAGE_ALT}" />
    <title>${SOCIAL_TITLE}</title>
  </head>
  <body><div id="app"></div><script type="module" src="/src/main.tsx"></script></body>
</html>`;
}

function pngHeader(width = 1200, height = 630): Buffer {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.writeUInt32BE(13, 8);
  png.write('IHDR', 12, 'ascii');
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  return png;
}

const validate = (html = validHtml(), image = pngHeader(), production = false) =>
  validateSocialMetadata({ html, image, production });

describe('social metadata validation', () => {
  it('accepts the documented generic .test fixture and exact contract', () => {
    expect(validate()).toEqual({
      siteUrl,
      imageUrl: `${siteUrl}${SOCIAL_IMAGE_PATH}`,
      imageWidth: 1200,
      imageHeight: 630,
    });
  });

  it('accepts a real-looking origin in strict production mode', () => {
    expect(validate(validHtml('https://coffee.kamacafe.com'), pngHeader(), true).siteUrl).toBe(
      'https://coffee.kamacafe.com',
    );
  });

  it.each([
    ['missing tag', (html: string) => html.replace(/\s*<meta property="og:type"[^>]+>/, '')],
    ['duplicate tag', (html: string) => html.replace('</head>', '  <meta property="og:title" content="duplicate" />\n</head>')],
    ['wrong copy', (html: string) => html.replace(SOCIAL_DESCRIPTION, 'Wrong description.')],
    ['unresolved token', (html: string) => html.replace(`${siteUrl}/`, '%VITE_SITE_URL%/')],
    ['duplicate card content source', (html: string) => html.replace('</head>', '  <meta name="twitter:title" content="duplicate" />\n</head>')],
  ])('rejects %s', (_name, mutate) => {
    expect(() => validate(mutate(validHtml()))).toThrow();
  });

  it.each([
    ['HTTP', 'http://coffee.kamacafe.com'],
    ['credentials', 'https://user:secret@coffee.kamacafe.com'],
    ['non-default port', 'https://coffee.kamacafe.com:8443'],
    ['path', 'https://coffee.kamacafe.com/path'],
    ['query', 'https://coffee.kamacafe.com?preview=true'],
    ['fragment', 'https://coffee.kamacafe.com/#latte'],
    ['example placeholder', 'https://example.com'],
  ])('rejects an invalid %s canonical origin', (_name, origin) => {
    expect(() => validate(validHtml(origin))).toThrow();
  });

  it.each([
    'https://preview.kamacafe.test',
    'https://localhost',
    'https://127.0.0.1',
    'https://192.168.1.20',
    'https://10.0.0.4',
    'https://172.16.0.4',
    'https://100.64.0.1',
    'https://192.0.2.1',
    'https://198.51.100.42',
    'https://203.0.113.10',
    'https://[2001:db8::1]',
    'https://service.local',
  ])('rejects %s in strict production mode', (origin) => {
    expect(() => validate(validHtml(origin), pngHeader(), true)).toThrow();
  });

  it('rejects a cross-origin or wrong-path image', () => {
    expect(() => validate(validHtml().replace(`${siteUrl}${SOCIAL_IMAGE_PATH}`, 'https://cdn.example.org/social.png'))).toThrow();
    expect(() => validate(validHtml().replace(SOCIAL_IMAGE_PATH, '/images/other.png'))).toThrow();
  });

  it('rejects wrong declared image properties', () => {
    expect(() => validate(validHtml().replace('content="image/png"', 'content="image/jpeg"'))).toThrow();
    expect(() => validate(validHtml().replace('content="1200"', 'content="1199"'))).toThrow();
    expect(() => validate(validHtml().replace('content="630"', 'content="629"'))).toThrow();
  });

  it('rejects an invalid PNG signature, chunk, or dimensions', () => {
    expect(() => validate(validHtml(), Buffer.alloc(24))).toThrow();

    const wrongChunk = pngHeader();
    wrongChunk.write('JUNK', 12, 'ascii');
    expect(() => validate(validHtml(), wrongChunk)).toThrow();

    expect(() => validate(validHtml(), pngHeader(1199, 630))).toThrow();
    expect(() => validate(validHtml(), pngHeader(1200, 629))).toThrow();
  });
});
