import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import type { Catalog } from '../../src/catalog/types';

const routes = ['/', '/#category-espresso-drink', '/#latte', '/#missing'];
const widths = [320, 390, 430, 680, 1440];
const phoneWidths = [320, 390, 393, 430];
const catalog = JSON.parse(readFileSync(new URL('../../catalog.json', import.meta.url), 'utf8')) as Catalog;

for (const width of widths) {
  test(`views remain accessible without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

      for (const link of await page.getByRole('link').all()) {
        const box = await link.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      }

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    }
  });

  test(`recipe guidance stays readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#latte');

    const guidanceRow = page.locator('.recipe-facts__row').filter({
      has: page.locator('dt').filter({ hasText: /^Water guidance$/ }),
    });
    const guidanceLabel = guidanceRow.locator('dt');
    const guidanceValue = guidanceRow.locator('dd');

    await expect(guidanceValue).toHaveText(
      'Fill the machine reservoir; target 36 g of brewed espresso rather than measuring water into the portafilter.',
    );

    const [rowBox, labelBox, valueBox] = await Promise.all([
      guidanceRow.boundingBox(),
      guidanceLabel.boundingBox(),
      guidanceValue.boundingBox(),
    ]);
    expect(rowBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    expect(valueBox).not.toBeNull();

    expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(valueBox!.y);
    expect(valueBox!.x).toBeGreaterThanOrEqual(rowBox!.x);
    expect(valueBox!.x + valueBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 0.5);

    const compactRow = page.locator('.recipe-facts__row').filter({
      has: page.locator('dt').filter({ hasText: /^Espresso yield$/ }),
    });
    const [compactLabelBox, compactValueBox] = await Promise.all([
      compactRow.locator('dt').boundingBox(),
      compactRow.locator('dd').boundingBox(),
    ]);
    expect(compactLabelBox).not.toBeNull();
    expect(compactValueBox).not.toBeNull();
    expect(compactValueBox!.x).toBeGreaterThan(compactLabelBox!.x);
    expect(Math.abs(compactValueBox!.y - compactLabelBox!.y)).toBeLessThanOrEqual(0.5);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

for (const width of phoneWidths) {
  test(`recipe images do not overlap hero facts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });

    for (const drink of catalog.drinks) {
      await page.goto(`/#${drink.id}`);

      const hero = page.locator('.drink-hero');
      const facts = hero.locator('.hero-facts');
      const image = hero.locator('.drink-hero__image');
      await expect(image).toBeVisible();

      const [heroBox, factsBox, imageBox] = await Promise.all([
        hero.boundingBox(),
        facts.boundingBox(),
        image.boundingBox(),
      ]);
      expect(heroBox).not.toBeNull();
      expect(factsBox).not.toBeNull();
      expect(imageBox).not.toBeNull();

      expect(factsBox!.y + factsBox!.height).toBeLessThanOrEqual(imageBox!.y + 0.5);
      expect(imageBox!.x).toBeGreaterThanOrEqual(heroBox!.x);
      expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(heroBox!.x + heroBox!.width + 0.5);
      expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(heroBox!.y + heroBox!.height + 0.5);
    }
  });
}

test('keyboard focus is visible and navigation uses semantic links', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.category-card--espresso img')).toHaveAttribute('src', '/images/espresso.png');
  await expect(page.locator('.category-card--brewed img')).toHaveAttribute('src', '/images/pour-over.png');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await expect(page.getByRole('link', { name: /Espresso drinks/ })).toBeVisible();
});

test('preparation guidance uses a logical heading and ordered list', async ({ page }) => {
  await page.goto('/#latte');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 2, name: 'What you need' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'How to make it' })).toBeVisible();
  await expect(page.locator('ol[aria-label="Preparation steps"]')).toBeVisible();
});
