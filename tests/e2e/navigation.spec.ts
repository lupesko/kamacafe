import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Catalog } from '../../src/catalog/types';

const catalog = JSON.parse(readFileSync(new URL('../../catalog.json', import.meta.url), 'utf8')) as Catalog;

test('a visitor can choose every category and open complete brewing guides', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'What are we brewing?' })).toBeVisible();

  for (const category of catalog.categories) {
    await page.goto('/');
    await expect(page.getByRole('link', { name: new RegExp(category.name) })).toHaveAttribute('href', `#category-${category.id}`);
    await page.getByRole('link', { name: new RegExp(category.name) }).click();
    await expect(page.getByRole('heading', { level: 1, name: category.name })).toBeVisible();

    const expectedDrinks = catalog.drinks.filter((drink) => drink.category === category.id);
    await expect(page.locator('.drink-row__name')).toHaveText(expectedDrinks.map(({ name }) => name));
    await expect(page.getByText(new RegExp(`^${expectedDrinks.length} recipes?$`))).toHaveCount(0);
  }

  await page.goto('/#category-espresso-drink');
  await page.getByRole('link', { name: /Latte/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Latte' })).toBeVisible();
  const latteCoffeeRow = page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: /^Ground coffee$/ }),
  });
  const latteMilkRow = page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: /^Milk$/ }),
  });
  await expect(latteCoffeeRow.locator('dd')).toHaveText('18 g');
  await expect(latteMilkRow.locator('dd')).toHaveText('180 mL · 60°C');
  await expect(page.getByText('fine · ~200–500 µm')).toBeVisible();
  await expect(page.getByText(/70–145 mg/)).toBeVisible();
  await expect(page.getByRole('list', { name: 'Preparation steps' }).getByRole('listitem')).toHaveCount(6);

  await page.goto('/#pour-over');
  await expect(page.getByRole('heading', { level: 1, name: 'Pour-over' })).toBeVisible();
  const pourOverWaterRow = page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: /^Water$/ }),
  });
  await expect(pourOverWaterRow.locator('dd')).toHaveText('240 mL · 94°C');
  await expect(page.getByText('medium-fine · ~500–800 µm')).toBeVisible();
  await expect(page.getByText(/140–230 mg/)).toBeVisible();
  await expect(page.getByText('Milk', { exact: true })).toHaveCount(0);

  await page.goto('/#french-press');
  await expect(page.getByRole('heading', { level: 1, name: 'French press' })).toBeVisible();
  await expect(page.getByText('240 mL').first()).toBeVisible();
  await expect(page.getByText('Add 16 g of coarse coffee to the press and pour in 240 mL of 94°C water.')).toBeVisible();

  for (const id of ['pour-over', 'french-press', 'turkish']) {
    await page.goto(`/#${id}`);
    await expect(page.locator('.recipe-facts__row').filter({
      has: page.locator('dt').filter({ hasText: /^Water temperature$/ }),
    })).toHaveCount(0);
  }
});

test('americano distinguishes espresso brewing water from dilution water', async ({ page }) => {
  await page.goto('/#americano');

  const brewTemperatureRow = page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: /^Espresso brew temperature$/ }),
  });
  await expect(brewTemperatureRow.locator('dd')).toHaveText('93°C');

  const dilutionWaterRow = page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: /^Dilution water$/ }),
  });
  await expect(dilutionWaterRow.locator('dd')).toHaveText('150 mL · 85°C');
  await expect(page.getByText('Add 150 mL of dilution water at about 85°C to a mug.')).toBeVisible();
});

test('shareable routes survive refresh and browser history', async ({ page }) => {
  await page.goto('/#category-espresso-drink');
  await expect(page.getByRole('heading', { level: 1, name: 'Espresso drinks' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/#category-espresso-drink$/);

  await page.getByRole('link', { name: /^Espresso\b/ }).click();
  await expect(page).toHaveURL(/#espresso$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Espresso' })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#category-espresso-drink$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Espresso drinks' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Espresso' })).toBeVisible();
});

test('unknown category, drink, and retired-looking hashes lead home', async ({ page }) => {
  for (const hash of ['#category-missing', '#missing-drink', '#retired-drink']) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Page unavailable' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '#');
  }
});

test('view changes reset scroll without moving keyboard focus', async ({ page }) => {
  await page.goto('/#latte');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole('link', { name: /Espresso drinks/ }).focus();
  await page.getByRole('link', { name: /Espresso drinks/ }).press('Enter');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
});
