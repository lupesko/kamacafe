import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import catalogJson from '../catalog.json';
import registryJson from '../catalog-id-registry.json';
import { validateCatalog } from '../src/catalog/validate';

const imageDirectory = fileURLToPath(new URL('../public/images/', import.meta.url));
const nonDrinkImages = new Set(['social-preview.png']);
const imageIds = new Set(
  (await readdir(imageDirectory))
    .filter((name) => name.endsWith('.png') && !nonDrinkImages.has(name))
    .map((name) => name.replace(/\.png$/, '')),
);
const issues = validateCatalog(catalogJson, registryJson, { imageIds });

if (issues.length) {
  console.error('Catalog validation failed:');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Catalog valid: ${catalogJson.categories.length} categories, ${catalogJson.drinks.length} drinks.`);
}
