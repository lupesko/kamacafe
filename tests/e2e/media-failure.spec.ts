import { expect, test } from '@playwright/test';

test('essential guidance survives complete image failure', async ({ page }) => {
  await page.route('**/*.png', (route) => route.abort());
  await page.goto('/#latte');

  await expect(page.getByRole('heading', { level: 1, name: 'Latte' })).toBeVisible();
  await expect(page.getByText('Ground coffee')).toBeVisible();
  await expect(page.getByText('Milk', { exact: true })).toBeVisible();
  const grindRow = page.locator('.recipe-facts__row').filter({
    has: page.locator('dt').filter({ hasText: /^Grind$/ }),
  });
  await expect(grindRow.locator('dd')).toHaveText('fine · ~200–500 µm');
  await expect(page.getByText('93°C', { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Preparation steps' }).getByRole('listitem')).toHaveCount(4);
});
