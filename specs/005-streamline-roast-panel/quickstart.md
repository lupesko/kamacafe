# Phase 1 Quickstart: Validate the Streamlined Roast Panel

Run these checks from the repository root after implementation. Behavioral and
state requirements are defined in [data-model.md](./data-model.md) and
[contracts/roast-panel-ui-contract.md](./contracts/roast-panel-ui-contract.md).

## Prerequisites

- nvm, Node.js 24.x, and npm
- Current Playwright-supported Chromium and WebKit hosts

```bash
nvm install
nvm use
npm ci
npx playwright install chromium webkit
```

## Validate types, domain regressions, and production build

```bash
npm run typecheck
npm test
npm run build
```

Expected result:

- strict TypeScript reports no errors;
- all existing recipe, routing, scaling, metadata, and deployment tests pass;
- the static production artifact builds without a new dependency, route, data
  request, or catalog change.

## Run focused browser checks

```bash
npx playwright test \
  tests/e2e/roast-recommendations.spec.ts \
  tests/e2e/responsive-accessibility.spec.ts \
  tests/e2e/media-failure.spec.ts \
  --project="Desktop Chrome"
```

Expected result:

1. Every tested guide labels the group `Pick your roast` and starts with roast
   details closed.
2. Light, Medium, and Dark remain visible and checked-state behavior is unchanged.
3. `About this roast` opens or closes the explanation with one activation and
   retains focus.
4. Closed details are not visible; expanded details show the selected roast’s
   starting-point heading and Flavor, Extraction, Temperature, and Grind.
5. Changing roast while closed keeps details closed and updates recipe facts and
   steps; opening afterward shows the matching explanation.
6. Changing roast while expanded keeps details expanded and updates all visible
   recommendation content.
7. Opening a different drink resets details to closed while retaining the
   existing visit-wide roast choice; reload resets the established Dark default
   and keeps details closed.
8. Aborting all PNG requests does not prevent selecting roast, opening details,
   or reading facts and preparation steps.

## Validate responsive geometry and accessibility

Run the responsive suite in all configured browsers:

```bash
npx playwright test tests/e2e/responsive-accessibility.spec.ts
```

At 320, 390, 430, 680, and 1440 px, expected outcomes are:

- each roast label occupies exactly one rendered text line;
- option text stays inside its control and the panel stays inside “What you need”;
- no horizontal page overflow occurs in either disclosure state;
- every roast option and the disclosure control is at least 44×44 CSS pixels;
- collapsed panel height is no more than 60% of expanded height;
- axe reports no WCAG A/AA violations with details closed or expanded;
- keyboard activation toggles details, communicates state, and retains focus;
- native radio arrow-key selection and visible focus continue to work.

## Manual layout and assistive check

Start the local preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Open `http://127.0.0.1:4173/#espresso`, then verify:

1. At a desktop width matching the reported screenshot, `Medium` remains on one
   line and the default panel shows only the heading, three choices, and summary.
2. At 320 px and 200% text enlargement, whole option controls may move to new
   rows, but all labels remain intact and no page-level horizontal scroll appears.
3. With keyboard only, Tab to `About this roast`, activate it with Enter and
   Space, and confirm focus remains visible on the summary.
4. With a screen reader, confirm the summary’s name and collapsed/expanded state
   are announced and closed explanation content is skipped.
5. Expand details, select each roast, and confirm the complete explanation
   matches facts and preparation steps without affecting serving controls.

## Full browser and performance regression

```bash
npm run test:e2e
npm run test:performance
```

Expected result:

- Mobile Safari, Mobile Chrome, Desktop Chrome, and Desktop WebKit pass;
- existing navigation, roast, scaling, media-failure, and social-sharing
  scenarios retain their outcomes;
- Lighthouse retains the current accessibility, paint, blocking-time, and asset
  budgets documented in `tests/performance/lighthouserc.json`.
