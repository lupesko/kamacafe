# Phase 1 Quickstart: Validate Roast-Aware Recommendations

Run these checks from the repository root after implementation. The expected
data and interaction rules are defined in [data-model.md](./data-model.md) and
[contracts/roast-guidance-contract.md](./contracts/roast-guidance-contract.md).

## Prerequisites

- nvm, Node.js 24.x, and npm
- Current Playwright-supported Chromium and WebKit hosts

```bash
nvm install
nvm use
npm ci
npx playwright install chromium webkit
```

## Validate catalog and types

```bash
npm run validate:catalog
npm run typecheck
```

Expected result:

- the successor catalog schema accepts the published catalog;
- Espresso, Pour-over, French press, and Turkish coffee each own exactly Light,
  Medium, and Dark recommendation records;
- every derived drink inherits a complete map;
- every drink resolves at all three levels;
- temperature and micron ranges are ordered and valid;
- Medium matches the approved baseline;
- brew-water ingredient temperatures match their selected recipe temperature;
- TypeScript reports no errors.

## Run focused domain tests

```bash
npx vitest run \
  tests/unit/catalog-validation.test.ts \
  tests/unit/recipe-resolution.test.ts \
  tests/unit/recipe-scaling.test.ts
```

Expected result:

1. Every root method resolves the exact target matrix for all three roasts.
2. Turkish coffee holds 20°C and ~50–200 µm while its explanation and controlled-heating content vary.
3. Latte and Americano inherit espresso settings and steps while milk and dilution water stay unchanged.
4. Medium returns the existing facts and steps exactly.
5. Resolution does not mutate source catalog objects.
6. Roast resolution precedes scaling: quantities and g/mL step mentions scale, while roast, temperature, grind, and explanation do not.
7. Invalid or incomplete roast maps, ranges, derived overrides, or synchronized water targets fail validation.

Run the complete unit suite:

```bash
npm test
```

## Build and preview

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Open `http://127.0.0.1:4173/#pour-over`.

Expected initial result: Dark is selected; the page shows 90°C, a medium grind
of approximately 700–1000 µm, Dark explanation content, and Dark-consistent
steps. Required guidance remains synchronous and no additional request is made
for recommendation data.

## Run browser scenarios

With the preview server available, run:

```bash
npm run test:e2e
```

The browser suite must verify:

### Selection and compatibility

1. Open each root method on a fresh load and confirm Dark is checked.
2. Select Light, Medium, and Dark and compare facts, all four explanation
   dimensions, and method steps against the contract matrix.
3. Return to Medium and confirm the prior approved recipe facts and steps
   exactly, including 93°C Espresso, 94°C Pour-over/French press, and 20°C
   Turkish coffee.
4. Rapidly select multiple options and confirm the final checked radio,
   explanation, facts, and steps all describe the final selection.
5. Confirm no troubleshooting or “fix your cup” guidance appears.

### Inheritance and protected fields

1. On Latte, select Light and Dark; confirm inherited espresso temperature,
   grind, and espresso steps change while 180 mL milk at 60°C and milk assembly
   steps remain fixed.
2. On Americano, confirm the espresso brew target changes while 150 mL
   dilution water at 85°C remains fixed.
3. Confirm chocolate, ice, espresso yield, coffee dose, caffeine, and serving
   metadata remain unchanged on their applicable guides.

### Scaling and transformation order

1. Open Pour-over, increase to two servings, then switch roast.
2. Confirm two servings remains selected; coffee becomes 30 g and water 480 mL.
3. Confirm Light shows 96°C and ~400–700 µm in facts and steps; Dark shows 90°C
   and ~700–1000 µm.
4. Change roast first and servings second; confirm the same final display.

### Navigation lifecycle

1. Select Light on one drink, navigate through its category to another drink,
   and confirm Light remains checked with the new method's guidance.
2. Use Back and Forward and confirm Light remains active.
3. Reload the page and confirm Dark resets.
4. Open a shared drink hash in a fresh browser context and confirm the same
   drink opens with Dark without changing the address contract.

### Accessibility, responsive layout, and media failure

1. Operate the selector with Tab and arrow keys; confirm visible focus and
   checked-state semantics.
2. Run axe with no WCAG A/AA violations.
3. At 320, 390, 430, 680, and 1440 px, confirm the selector and explanations
   wrap within their panel and the document has no horizontal overflow.
4. Confirm every radio label has at least a 44 by 44 CSS-pixel target.
5. Abort PNG requests and confirm the selector, explanations, facts, and steps
   remain complete and usable.
6. Repeat representative flows in Mobile Safari, Mobile Chrome, Desktop
   Chrome, and Desktop WebKit projects.

## Performance regression check

```bash
npm run test:performance
```

Expected result: current Lighthouse and asset budgets still pass. Use the
Playwright mobile Chromium profile at a 390 by 844 CSS-pixel viewport, device
scale factor 3, mobile mode, touch enabled, and 4x CPU slowdown as the reference
profile. After one unmeasured warm-up, run 100 roast changes. Measure each change
from the selector's change event until the checked state, four explanation
fields, recipe facts, and preparation steps all reflect the selected roast. At
least 95 interactions must finish within 1,000 milliseconds. Record the
Playwright, Chromium, and operating-system versions, timing method, and raw pass
count with the release results. Essential guidance retains the existing
3-second load target.

## Manual release check

On a current real phone and current Safari desktop:

1. Complete one espresso-derived and one brewed-coffee flow using touch.
2. Repeat selector and navigation behavior with keyboard and VoiceOver.
3. Confirm explanations are understandable without coffee terminology beyond
   the terms they define.
4. Confirm all temperature, grind, amount, and step values agree before
   approving the release candidate.

## Implementation verification record

Recorded 2026-11-05 in the managed macOS development environment.

| Check | Result | Evidence / caveat |
|---|---|---|
| `npm run validate:catalog` | PASS | Successor schema and semantic publication checks accepted 2 categories and 11 drinks. |
| `npm run typecheck` | PASS | TypeScript strict check completed without errors. |
| `npm test` | PASS | 9 Vitest files and 115 tests passed. |
| `npm run build` | PASS with documented local environment | Vite built 33 modules; social metadata validation passed for `https://preview.kamacafe.test` when the `.env.example` values were supplied. A bare build without `.env.local` correctly failed the pre-existing absolute social-URL gate. |
| `npx playwright test --list` | PASS | Playwright discovered 152 tests across all four configured projects, including the complete roast matrix, accessibility, responsive, media-failure, navigation, and scaling scenarios. |
| `npm run test:e2e` | BLOCKED BY HOST | The command ran: 12 response-only social tests passed, while all 140 browser-backed cases failed before page execution. Chromium could not register its macOS Mach rendezvous service (`Permission denied (1100)`); WebKit aborted during launch. No application assertion ran and failed. Re-run on a supported unrestricted Playwright host. |
| `npm run test:performance` | BLOCKED BY HOST | The default health check could not find system Chrome. With `CHROME_PATH` pointed at Playwright Chromium 153.0.8010.12, the health check passed but Lighthouse could not connect to the browser after launch. No Lighthouse score or asset-budget assertion was produced. |
| 100 measured roast changes | NOT RUN | Browser launch was unavailable, so the 390 × 844, device-scale-factor 3, touch-enabled, 4× CPU profile and the required raw 95-of-100 count could not be measured. |
| Current Safari keyboard and VoiceOver | NOT RUN | Requires a supported interactive Safari/VoiceOver host or real device. The automated native-radio, axe, 44 px target, responsive-width, and no-overflow cases are present but remain pending execution. |

Release status: catalog, types, units, and the production artifact pass. Browser,
Lighthouse, 100-change timing, real-device/Safari keyboard, VoiceOver,
three-second guidance, accessibility, and no-overflow release gates remain
pending on a supported host; do not treat this record as production approval.
