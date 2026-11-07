import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { Catalog, RoastLevel } from '../../src/catalog/types';

const catalog = JSON.parse(readFileSync(new URL('../../catalog.json', import.meta.url), 'utf8')) as Catalog;

const factRow = (page: Page, label: string) => page.locator('.recipe-facts__row').filter({
  has: page.locator('dt').filter({ hasText: new RegExp(`^${label}$`) }),
});

const roastDetails = (page: Page) => page.locator('details.roast-details');
const roastSummary = (page: Page) => page.locator('summary.roast-details__summary');

const openRoastDetails = async (page: Page) => {
  const details = roastDetails(page);
  if (!await details.evaluate((element) => element.hasAttribute('open'))) {
    await roastSummary(page).click();
  }
  await expect(details).toHaveAttribute('open', '');
};

test('Dark is the fresh-load default and switching roast updates facts and local steps', async ({ page }) => {
  await page.goto('/#pour-over');

  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Light' })).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'Medium' })).not.toBeChecked();
  await expect(factRow(page, 'Water').locator('dd')).toHaveText('240 mL · 90°C');
  await expect(factRow(page, 'Grind').locator('dd')).toHaveText('medium · ~700–1,000 µm');
  await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('90°C');

  await page.getByRole('radio', { name: 'Light' }).check();
  await expect(factRow(page, 'Water').locator('dd')).toHaveText('240 mL · 96°C');
  await expect(factRow(page, 'Grind').locator('dd')).toHaveText('fine-to-medium-fine · ~400–700 µm');
  await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('96°C');

  await page.getByRole('radio', { name: 'Medium' }).check();
  await expect(factRow(page, 'Water').locator('dd')).toHaveText('240 mL · 94°C');
  await expect(factRow(page, 'Grind').locator('dd')).toHaveText('medium-fine · ~500–800 µm');
});

test('the selection persists during the visit and resets to Dark on reload', async ({ page }) => {
  await page.goto('/#espresso');
  await page.getByRole('radio', { name: 'Light' }).check();
  await page.getByRole('link', { name: /Espresso drinks/ }).click();
  await page.getByRole('link', { name: /Latte/ }).click();
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();

  await page.goBack();
  await page.goForward();
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
});

test('roast explanation starts closed, follows its own toggle state, and resets for a new guide', async ({ page }) => {
  await page.goto('/#espresso');

  await expect(roastSummary(page)).toHaveText('About this roast');
  await expect(roastDetails(page)).not.toHaveAttribute('open', '');
  await expect(page.locator('.roast-explanation')).not.toBeVisible();
  for (const roast of ['Light', 'Medium', 'Dark']) {
    await expect(page.getByRole('radio', { name: roast })).toBeVisible();
  }

  await page.getByRole('radio', { name: 'Light' }).check();
  await expect(roastDetails(page)).not.toHaveAttribute('open', '');
  await expect(factRow(page, 'Espresso brew temperature').locator('dd')).toHaveText('94°C');

  await openRoastDetails(page);
  await expect(page.getByText('Light roast starting point')).toBeVisible();
  await page.getByRole('radio', { name: 'Medium' }).check();
  await expect(roastDetails(page)).toHaveAttribute('open', '');
  await expect(page.getByText('Medium roast starting point')).toBeVisible();

  await roastSummary(page).click();
  await expect(roastDetails(page)).not.toHaveAttribute('open', '');
  await expect(page.locator('.roast-explanation')).not.toBeVisible();
  await expect(page.getByRole('radio', { name: 'Medium' })).toBeVisible();

  await page.getByRole('link', { name: /Espresso drinks/ }).click();
  await page.getByRole('link', { name: /Latte/ }).click();
  await expect(roastDetails(page)).not.toHaveAttribute('open', '');
  await openRoastDetails(page);
  await page.reload();
  await expect(roastDetails(page)).not.toHaveAttribute('open', '');
});

test('changing roast retains the serving multiplier', async ({ page }) => {
  await page.goto('/#pour-over');
  await page.getByRole('button', { name: 'Increase servings' }).click();
  await page.getByRole('radio', { name: 'Light' }).check();

  await expect(factRow(page, 'Ground coffee').locator('dd')).toHaveText('30 g');
  await expect(factRow(page, 'Water').locator('dd')).toHaveText('480 mL · 96°C');
  await expect(page.getByText('2 servings', { exact: false })).toBeVisible();
});

test('every selected roast explains flavor, extraction, temperature, and grind without troubleshooting', async ({ page }) => {
  await page.goto('/#espresso');
  await openRoastDetails(page);

  for (const roast of ['Light', 'Medium', 'Dark']) {
    await page.getByRole('radio', { name: roast }).check();
    await expect(page.getByText(`${roast} roast starting point`)).toBeVisible();
    for (const dimension of ['Flavor', 'Extraction', 'Temperature', 'Grind']) {
      const row = page.locator('.roast-explanation dl > div').filter({
        has: page.locator('dt').filter({ hasText: new RegExp(`^${dimension}$`) }),
      });
      await expect(row.locator('dd')).not.toBeEmpty();
    }
  }

  await expect(page.getByText(/troubleshoot|fix your cup/i)).toHaveCount(0);
});

test('Turkish guidance explicitly explains fixed settings while controlled heating changes', async ({ page }) => {
  await page.goto('/#turkish');
  await openRoastDetails(page);

  for (const roast of ['Light', 'Medium', 'Dark']) {
    await page.getByRole('radio', { name: roast }).check();
    await expect(page.locator('.roast-explanation')).toContainText(/unchanged.*20°C/i);
    await expect(page.locator('.roast-explanation')).toContainText(/unchanged.*extra-fine.*50–200 µm/i);
    await expect(factRow(page, 'Water').locator('dd')).toHaveText('70 mL · 20°C');
    await expect(factRow(page, 'Grind').locator('dd')).toHaveText('extra-fine · ~50–200 µm');
  }

  await page.getByRole('radio', { name: 'Light' }).check();
  await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('slowly and steadily');
  await page.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('Heat gently');
});

const methodByDrink = new Map(catalog.drinks.map((drink) => [
  drink.id,
  drink.recipe.baseRecipeId ? 'espresso' : drink.id,
]));

const matrix: Record<string, Record<RoastLevel, { temperature: string; grind: string }>> = {
  espresso: {
    light: { temperature: '94°C', grind: 'fine · ~150–400 µm' },
    medium: { temperature: '93°C', grind: 'fine · ~200–500 µm' },
    dark: { temperature: '90–91°C', grind: 'slightly coarser fine · ~300–600 µm' },
  },
  'pour-over': {
    light: { temperature: '96°C', grind: 'fine-to-medium-fine · ~400–700 µm' },
    medium: { temperature: '94°C', grind: 'medium-fine · ~500–800 µm' },
    dark: { temperature: '90°C', grind: 'medium · ~700–1,000 µm' },
  },
  'french-press': {
    light: { temperature: '96°C', grind: 'medium-coarse · ~800–1,100 µm' },
    medium: { temperature: '94°C', grind: 'coarse · ~1,000–1,400 µm' },
    dark: { temperature: '90°C', grind: 'coarse-to-very-coarse · ~1,200–1,600 µm' },
  },
  turkish: {
    light: { temperature: '20°C', grind: 'extra-fine · ~50–200 µm' },
    medium: { temperature: '20°C', grind: 'extra-fine · ~50–200 µm' },
    dark: { temperature: '20°C', grind: 'extra-fine · ~50–200 µm' },
  },
};

test('every published drink renders the exact method matrix for all three roasts', async ({ page }) => {
  for (const drink of catalog.drinks) {
    await page.goto(`/#${drink.id}`);
    await expect(roastDetails(page)).not.toHaveAttribute('open', '');
    const roastGroup = page.getByRole('group', { name: 'Pick your roast' });
    await expect(roastGroup).toBeVisible();
    for (const label of ['Light', 'Medium', 'Dark']) {
      await expect(roastGroup.getByRole('radio', { name: label })).toBeVisible();
    }
    const method = methodByDrink.get(drink.id)!;
    for (const level of ['light', 'medium', 'dark'] as const) {
      const label = `${level[0].toUpperCase()}${level.slice(1)}`;
      const expected = matrix[method][level];
      await page.getByRole('radio', { name: label }).check();
      await expect(factRow(page, 'Grind').locator('dd')).toHaveText(expected.grind);
      if (method === 'espresso') {
        await expect(factRow(page, 'Espresso brew temperature').locator('dd')).toHaveText(expected.temperature);
      } else {
        await expect(factRow(page, 'Water').locator('dd')).toContainText(expected.temperature);
      }
      // Turkish steps may include the exact temperature after roast selection while preserving the room-temperature cue.
      await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText(
        method === 'turkish' ? /room-temperature(?: 20°C)? water/ : expected.temperature,
      );
    }
  }
});

test('derived drinks protect milk, dilution, chocolate, ice, and assembly content', async ({ page }) => {
  const protectedContent: Record<string, string[]> = {
    latte: ['180 mL · 60°C', 'Pour the milk into the espresso'],
    americano: ['150 mL · 85°C', 'Pour the espresso into the water'],
    mocha: ['20 g', '180 mL · 60°C', 'chocolate sauce'],
    'iced-latte': ['180 mL · 4°C', '120 g', 'milk and ice'],
  };

  for (const [drinkId, values] of Object.entries(protectedContent)) {
    await page.goto(`/#${drinkId}`);
    for (const roast of ['Light', 'Dark']) {
      await page.getByRole('radio', { name: roast }).check();
      for (const value of values) await expect(page.getByText(value, { exact: false }).first()).toBeVisible();
    }
  }
});

test('changing servings before or after roast produces the same two-serving Pour-over', async ({ page }) => {
  const assertFinalState = async () => {
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
    await expect(factRow(page, 'Ground coffee').locator('dd')).toHaveText('30 g');
    await expect(factRow(page, 'Water').locator('dd')).toHaveText('480 mL · 96°C');
    await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('60 mL of 96°C water');
    await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('remaining 420 mL');
  };

  await page.goto('/#pour-over');
  await page.getByRole('button', { name: 'Increase servings' }).click();
  await page.getByRole('radio', { name: 'Light' }).check();
  await assertFinalState();

  await page.reload();
  await page.getByRole('radio', { name: 'Light' }).check();
  await page.getByRole('button', { name: 'Increase servings' }).click();
  await assertFinalState();
});

test('rapid selection leaves the final checked option, explanations, facts, and steps synchronized', async ({ page }) => {
  await page.goto('/#french-press');
  await openRoastDetails(page);
  await page.getByRole('radio', { name: 'Light' }).check();
  await page.getByRole('radio', { name: 'Medium' }).check();
  await page.getByRole('radio', { name: 'Dark' }).check();

  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(page.getByText('Dark roast starting point')).toBeVisible();
  await expect(factRow(page, 'Water').locator('dd')).toHaveText('240 mL · 90°C');
  await expect(factRow(page, 'Grind').locator('dd')).toHaveText('coarse-to-very-coarse · ~1,200–1,600 µm');
  await expect(page.getByRole('list', { name: 'Preparation steps' })).toContainText('90°C');
  await expect(page.getByRole('list', { name: 'Preparation steps' })).not.toContainText('94°C');
  await expect(page.getByRole('list', { name: 'Preparation steps' })).not.toContainText('96°C');
});
