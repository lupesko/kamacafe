import { expect, test } from '@playwright/test';

test('every view exposes the public project and contribution instructions', async ({ page }) => {
  for (const route of ['/', '/#latte', '/#missing']) {
    await page.goto(route);
    await expect(page.getByRole('link', { name: 'GitHub project' })).toHaveAttribute('href', 'https://github.com/lupesko/kamacafe');
    await expect(page.getByRole('link', { name: 'Report an issue' })).toHaveAttribute('href', 'https://github.com/lupesko/kamacafe/issues');
    await expect(page.getByRole('link', { name: 'Contribute a recipe' })).toHaveAttribute('href', 'https://github.com/lupesko/kamacafe/blob/main/CONTRIBUTING.md');
  }
});
