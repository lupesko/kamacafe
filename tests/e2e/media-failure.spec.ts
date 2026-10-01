import { expect, test } from '@playwright/test';

test('essential guidance survives complete image failure', async ({ page }) => {
  await page.route('**/*.png', (route) => route.abort());
  await page.goto('/#latte');

  await expect(page.getByRole('heading', { level: 1, name: 'Latte' })).toBeVisible();
  await expect(page.getByText('Ground coffee')).toBeVisible();
  await expect(page.getByText('Milk', { exact: true })).toBeVisible();
  await expect(page.getByText('fine', { exact: true })).toBeVisible();
  await expect(page.getByText('93°C', { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Preparation steps' }).getByRole('listitem')).toHaveCount(4);
});
