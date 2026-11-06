import { expect, test } from '@playwright/test';

test('essential guidance survives complete image failure', async ({ page }) => {
  await page.route('**/*.png', (route) => route.abort());
  await page.goto('/#latte');

  await expect(page.getByRole('heading', { level: 1, name: 'Latte' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(page.locator('.roast-explanation dt')).toHaveText(['Flavor', 'Extraction', 'Temperature', 'Grind']);
  await expect(page.getByText('Ground coffee')).toBeVisible();
  await expect(page.getByText('Milk', { exact: true })).toBeVisible();
  const grindRow = page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: /^Grind$/ }),
  });
  await expect(grindRow.locator('dd')).toHaveText('slightly coarser fine · ~300–600 µm');
  await expect(page.getByText('90–91°C', { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Preparation steps' }).getByRole('listitem')).toHaveCount(6);
  await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('90–91°C');
});
