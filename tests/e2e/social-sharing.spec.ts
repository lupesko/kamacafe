import { expect, test } from '@playwright/test';

const socialTitle = 'KamaCafé — Brew the perfect cup';
const socialDescription = 'Clear guides for brewing the perfect coffee.';
const siteUrl = 'https://preview.kamacafe.test';
const imageUrl = `${siteUrl}/images/social-preview.png`;

test('initial response exposes the required Open Graph preview without JavaScript', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  const html = await response.text();

  expect(html).toContain(`<title>${socialTitle}</title>`);
  expect(html).toContain(`<meta name="description" content="${socialDescription}"`);
  expect(html).toContain(`<link rel="canonical" href="${siteUrl}/"`);
  expect(html).toContain(`<meta property="og:title" content="${socialTitle}"`);
  expect(html).toContain('<meta property="og:type" content="website"');
  expect(html).toContain(`<meta property="og:url" content="${siteUrl}/"`);
  expect(html).toContain(`<meta property="og:image" content="${imageUrl}"`);
});

test('every hash route exposes one consistent recommended preview and large-image card', async ({ request }) => {
  for (const route of ['/', '/#category-espresso-drink', '/#latte', '/#missing']) {
    const response = await request.get(route);
    expect(response.ok()).toBe(true);
    const html = await response.text();

    for (const marker of [
      '<meta property="og:locale" content="en_US"',
      '<meta property="og:site_name" content="KamaCafé"',
      `<meta property="og:description" content="${socialDescription}"`,
      '<meta property="og:image:type" content="image/png"',
      '<meta property="og:image:width" content="1200"',
      '<meta property="og:image:height" content="630"',
      '<meta name="twitter:card" content="summary_large_image"',
    ]) {
      expect(html.split(marker)).toHaveLength(2);
    }

    expect(html).toContain(`<link rel="canonical" href="${siteUrl}/"`);
    expect(html).toContain(`<meta property="og:url" content="${siteUrl}/"`);
    expect(html).not.toContain('name="twitter:title"');
    expect(html).not.toContain('name="twitter:description"');
    expect(html).not.toMatch(/<meta name="twitter:image" content=/);
    expect(html).not.toMatch(/%VITE_[A-Z0-9_]+%/);
  }

  const imageResponse = await request.get('/images/social-preview.png');
  expect(imageResponse.ok()).toBe(true);
  expect(imageResponse.headers()['content-type']).toContain('image/png');
});

test('text and image alternatives remain complete without fetching preview media', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  const alt = 'KamaCafé coffee brewing guides with illustrated coffee drinks';

  expect(html).toContain(`<title>${socialTitle}</title>`);
  expect(html).toContain(`<meta name="description" content="${socialDescription}"`);
  expect(html).toContain(`<meta property="og:description" content="${socialDescription}"`);
  expect(html).toContain(`<meta property="og:image:alt" content="${alt}"`);
  expect(html).toContain(`<meta name="twitter:image:alt" content="${alt}"`);
});
