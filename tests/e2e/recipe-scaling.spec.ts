import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const factRow = (page: Page, label: string) =>
  page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: new RegExp(`^${label}$`) }),
  });

test('a brewed-coffee recipe exposes its ratio and scales a larger batch', async ({ page }) => {
  await page.goto('/#pour-over');

  await expect(page.getByText('1:16', { exact: true })).toBeVisible();
  await expect(page.getByText('Coffee : water', { exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveCount(0);

  await page.getByRole('button', { name: 'Increase servings' }).click();

  await expect(factRow(page, 'Ground coffee').locator('dd')).toHaveText('30 g');
  await expect(factRow(page, 'Water').locator('dd')).toHaveText('480 mL · 94°C');
  await expect(factRow(page, 'Water temperature')).toHaveCount(0);
  await expect(factRow(page, 'Paper filter').locator('dd')).toHaveText('1 filter');
  await expect(page.getByText('Pour 60 mL of 94°C water to wet all the grounds; wait 30 seconds.')).toBeVisible();
  await expect(page.getByText('Pour the remaining 420 mL slowly in circles. Aim to finish draining in 3–4 minutes.')).toBeVisible();

  const makes = page.locator('.hero-facts > div').filter({ has: page.locator('dt').filter({ hasText: /^Makes$/ }) });
  await expect(makes.locator('dd')).toContainText('2 servings');
  await expect(makes.locator('small')).toHaveText('≈ 480 mL');
});

test('espresso-based recipes stay fixed at one serving and omit batch controls', async ({ page }) => {
  await page.goto('/#latte');

  await expect(page.getByRole('region', { name: 'Scale recipe' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Increase servings' })).toHaveCount(0);
  await expect(page.getByText('Coffee : espresso yield', { exact: true })).toHaveCount(0);
  const serving = page.locator('.hero-facts > div').filter({ has: page.locator('dt').filter({ hasText: /^Serving$/ }) });
  await expect(serving.locator('dd')).toHaveText('216 mL');
  await expect(factRow(page, 'Ground coffee').locator('dd')).toHaveText('18 g');
  await expect(factRow(page, 'Milk').locator('dd')).toHaveText('180 mL · 60°C');
  await expect(factRow(page, 'Espresso yield').locator('dd')).toHaveText('36 g');

  await page.goto('/#americano');
  await expect(page.getByRole('region', { name: 'Scale recipe' })).toHaveCount(0);
  await expect(factRow(page, 'Dilution water').locator('dd')).toHaveText('150 mL · 85°C');
});
