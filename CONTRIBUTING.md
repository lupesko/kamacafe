# Contributing to KamaCafe

KamaCafe welcomes public issues and pull requests that make its brewing guidance clearer, broader, more accurate, or easier to use.

## Report a problem

Open a [GitHub issue](https://github.com/lupesko/kamacafe/issues) and include:

- the category or drink and its URL;
- what is incorrect, incomplete, or difficult to use;
- the expected guidance or behavior;
- a reliable source for recipe or caffeine changes when applicable;
- the device and browser for interface problems.

Never include credentials, Terraform state, API tokens, or private account details.

## Propose a recipe

Every recipe change must preserve the catalog contract. A new drink needs:

- a permanent lowercase ID containing only letters, digits, and hyphens;
- a category reference, name, one-line description, serving size in mL, preparation time, difficulty and explanation;
- a caffeine estimate in mg with an HTTPS source and a variability note;
- coffee in g, water in mL or an espresso yield in g, grind, water temperature in °C, and ordered steps;
- milk amount in mL and milk temperature in °C when milk is used;
- explicit ranges or assumptions where equipment or taste changes a value;
- a transparent PNG named `public/images/{drink-id}.png`;
- an active, never-reused record in `catalog-id-registry.json`.

The existing recipe values are approved seed content. Change them only when the pull request explains the evidence and user benefit.

## Verify a change

Use Node.js 24 and run:

```bash
nvm use
npm ci
npx playwright install chromium webkit
npm run validate:catalog
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:performance
```

For Terraform changes, also run the commands in `infra/README.md`. Do not commit `.tfvars`, plans, state, credentials, or generated bundles.

## Submit a pull request

Describe the user-visible change, link its issue, list the commands and devices used for verification, and note documentation or catalog updates. Reviewers apply the product principles in `.specify/memory/constitution.md`, including complete brewing guidance, simplicity, mobile usability, open collaboration, maintainability, static hosting, and secret safety.
