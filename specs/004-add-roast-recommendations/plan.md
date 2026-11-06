# Implementation Plan: Roast-Aware Brewing Recommendations

**Branch**: `004-add-roast-recommendations` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-add-roast-recommendations/spec.md`

## Summary

Extend KamaCafe's existing catalog-driven recipe model so each underlying root
method owns complete Light, Medium, and Dark explanation content plus only the
settings and local steps that differ from the approved Medium baseline. Make
recipe resolution roast-aware before the existing scaling transformation, so
espresso-derived drinks inherit selected espresso guidance while their milk,
chocolate, ice, dilution, and assembly content remains unchanged. Keep one
visit-wide roast value in the existing `App`, default it to Dark on every fresh
load, and expose it through one controlled, native-radio selector in the drink
guide. Use the current Preact, TypeScript, JSON Schema/Ajv, plain CSS, Vitest,
Playwright/axe, and Lighthouse stack with no new dependency.

## Technical Context

**Language/Version**: TypeScript 5.9 in strict mode on Node.js 24.x; Preact JSX;
HTML5; modern CSS

**Primary Dependencies**: Preact 10.27, Vite 8, `@preact/preset-vite`; Ajv 8 and
`ajv-formats` for build-time catalog validation; no new runtime, UI,
state-management, routing, templating, or test dependency

**Storage**: Version-controlled `catalog.json` and catalog ID registry; in-memory
visit state only; no database, browser storage, cookie, or server-side state

**Testing**: TypeScript type checking; Vitest 4 for recipe resolution,
transformation order, and catalog validation; Playwright 1.55 across mobile and
desktop Chromium/WebKit; `@axe-core/playwright` for accessibility; Lighthouse
CI for the existing mobile performance and asset budgets

**Target Platform**: Responsive static single-page web app served as Cloudflare
Workers Static Assets; current Android Chrome, current iOS Safari, latest desktop
Chrome, and latest desktop Safari. Additional iOS Safari versions are best-effort
unless they are included in the recorded release-validation matrix.

**Project Type**: Client-only static web application

**Performance Goals**: On the reference mobile profile documented in
`quickstart.md`, at least 95 of 100 measured roast changes after one warm-up
update the selected state, four explanations, facts, and steps within 1 second;
retain the existing Lighthouse budgets and the 3-second essential-guidance
target; add no request or runtime data fetch

**Constraints**: Preserve existing hash addresses and navigation; Dark on a
fresh load with visit-wide in-memory persistence afterward; Medium reproduces
approved existing values and steps; no accounts or persistence across reloads;
no request-time compute; US English; explicit g, mL, µm, and °C units; 320–1440
px without horizontal overflow; complete keyboard/touch operation; no
troubleshooting feature; no unnecessary dependency

**Scale/Scope**: 11 current drinks; four root brewing methods (espresso,
pour-over, French press, Turkish coffee); three roast levels; seven drinks that
inherit espresso guidance; one selector and one recommendation explanation
surface on each drink guide

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Design evidence | Status |
|---|---|---|
| Useful Brewing Guidance | Every resolved roast variant retains coffee and water/yield amounts, explicit temperature and grind guidance, ordered steps, and method-specific explanations. Range-capable °C guidance represents the required 90–91°C espresso target without false precision. | PASS |
| Simplicity, Beauty, and Speed | Reuse the root recipe inheritance graph, `App` state, existing recipe panels, plain CSS, and current validators. Add one focused selector component and no dependency, storage layer, route, service, or request. | PASS |
| Mobile Usability | Use a native fieldset/radio group, visible selected state and focus, at least 44 px targets, wrapping Cocoa styles, and the existing 320–1440 px Playwright/axe matrix. | PASS |
| Open Collaboration | Publish the successor catalog contract and roast guidance contract, update contributor guidance, and keep all content and validation reviewable in the public repository. | PASS |
| Maintainable Changes | Keep Medium as the approved baseline, make roast resolution a pure extension of existing recipe resolution, reject incomplete maps before publication, and add unit and cross-browser regression coverage. | PASS |
| Static Hosting | All recommendation content remains build-time catalog data and all state remains client memory; the generated app remains static with no request-time compute. | PASS |
| Secrets | The feature adds no credentials, private data, analytics, storage, or external integration. | PASS |

**Post-design re-check**: PASS. Phase 1 retains one static frontend and one
catalog source of truth. The successor schema, semantic validation rules,
native controls, and focused tests add only the structure needed to prevent
incomplete recommendations or contradictory facts and steps. No constitutional
exception or complexity justification is required.

## Project Structure

### Documentation (this feature)

```text
specs/004-add-roast-recommendations/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── catalog.schema.json
│   └── roast-guidance-contract.md
└── tasks.md                         # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
catalog.json                         # Add root-method roast maps and variant content
CONTRIBUTING.md                      # Document roast content and validation rules
README.md                            # Note user-visible roast selection behavior
src/
├── app.tsx                          # Own visit-wide roast state; resolve active variant
├── catalog/
│   ├── load.ts                      # Build roast-aware resolved recipe indexes
│   ├── resolve-recipe.ts            # Select/inherit roast data before combining steps
│   ├── scale-recipe.ts              # Existing post-resolution quantity transformation
│   ├── types.ts                     # Roast and temperature-guidance types
│   └── validate.ts                  # Successor schema plus all-roast semantic checks
├── components/
│   ├── roast-selector.tsx           # Controlled native radio group and explanations
│   ├── recipe-panels.tsx            # Reuse facts, ratio/scaling, and ordered steps
│   └── recipe-scaler.tsx            # Existing serving controls unchanged
├── views/
│   └── drink-view.tsx               # Keep multiplier local; pass roast controls/content
└── styles/
    ├── tokens.css                   # Reuse existing Cocoa tokens
    └── app.css                      # Focused selector/explanation responsive styles
tests/
├── unit/
│   ├── catalog-validation.test.ts   # Completeness, ranges, inheritance, synchronization
│   ├── recipe-resolution.test.ts    # Three variants and espresso-derived behavior
│   └── recipe-scaling.test.ts       # Roast resolution before serving scaling
└── e2e/
    ├── roast-recommendations.spec.ts
    ├── navigation.spec.ts           # Preserve routes/history; choose Medium for baselines
    ├── recipe-scaling.spec.ts       # Preserve multiplier while roast changes
    ├── responsive-accessibility.spec.ts
    └── media-failure.spec.ts
```

**Structure Decision**: Preserve the current single-project layout. `App` is
the narrowest state owner that survives hash navigation, while keyed
`DrinkView` instances continue to own and reset serving multipliers. Root
recipes remain the method abstraction: espresso-derived drinks already inherit
from Espresso, so a new method registry would duplicate existing relationships.
The feature contract versions the catalog schema under this feature directory;
the implementation will point the existing validator at that successor rather
than mutating the historical baseline contract.

## Implementation Design

### Roast state and navigation

- Add `RoastLevel = 'light' | 'medium' | 'dark'` and a stable ordered constant.
- Initialize one `useState<RoastLevel>('dark')` in `App`.
- Pass the value and controlled change callback through `DrinkView` to the
  selector. Do not use context, URL parameters, browser storage, or cookies.
- Because `App` survives hash changes, the value persists through in-app links
  and Back/Forward. A reload remounts `App` and resets Dark.
- Keep `key={drink.id}` on `DrinkView`; changing roast does not change the key,
  so a non-default serving multiplier remains selected.

### Catalog ownership and resolution

- Keep each root recipe's current `grind`, `waterTemperatureC`, and `steps` as
  the exact Medium baseline.
- Add exactly one `roastRecommendations` map to each root recipe. Every map has
  `light`, `medium`, and `dark` explanation records. Light/Dark records carry
  explicit adjustment fields only where settings or local method steps differ;
  Medium has no adjustment and therefore cannot drift from the baseline.
- Derived recipes omit roast maps and inherit their root method's selected
  recommendation. Publication rejects local derived maps to avoid ambiguous
  partial merging.
- Extend `resolveRecipe` with a defaulted roast argument (`medium` preserves
  existing callers). Select the root adjustment before ancestor/local steps
  are combined, append unchanged derived assembly steps, and expose the
  selected explanation on `ResolvedRecipe`.
- When a selected roast changes brew-water temperature, synchronize only the
  ingredient named by the existing brew-ratio water target. Never infer by
  display text and never alter milk or dilution-water temperatures.
- Resolve first, then call the unchanged serving scaler. This preserves ratios,
  quantities, yields, and equipment counts while scaling quantity-bearing
  selected steps normally.
- Use explicit Light/Dark local step arrays rather than replacing arbitrary
  Medium prose. Four small root methods make this duplication bounded, while
  exact arrays preserve Medium wording and make every variant editorially
  reviewable.

### Temperature ranges

- Introduce `TemperatureGuidance = number | { min: number; max: number }` for
  recipe and ingredient temperature fields so 90–91°C is represented as data.
- Format single values and ranges through one shared helper. Validate all bounds
  from 0 through 100 and ordered ranges.
- Compare/synchronize temperature guidance structurally rather than by object
  identity. Existing numeric values require no catalog migration beyond the
  roast content.

### Presentation

- Add one controlled `RoastSelector` using `<fieldset>`, `<legend>`, and three
  native labelled radio inputs in Light/Medium/Dark order.
- Render the selected flavor, extraction, temperature explanation, and grind
  explanation in the same compact section inside the existing “What you need”
  panel, before facts whose values it controls.
- Feed the selected resolved recipe to the existing `RecipePanels`; retain its
  ingredient rows, grind formatter, temperature placement, ratio/scaler, and
  ordered-step renderer as the authoritative display path.
- Reuse Cocoa tokens, rounded surfaces, focus outline, grid wrapping, and
  44-pixel control targets. Selected state must be expressed by native checked
  state and text, not color alone.

### Validation and regression strategy

- Point catalog validation at the successor schema in `contracts/` and retain
  all current schema and semantic rules.
- Add semantic checks for root ownership, exact roast keys, nonblank copy,
  range validity, Medium compatibility, three-roast resolution for every
  published drink, brew-water temperature synchronization, and nonempty local
  variant steps.
- Unit-test all four root methods × three roasts, immutability, espresso-derived
  content preservation, and resolve-before-scale composition.
- Add Playwright coverage for Dark fresh-load default, switching all levels,
  facts/steps consistency, visit-wide navigation/history, reload reset,
  scaling preservation, derived drinks, rapid selection, image failure,
  keyboard operation, axe, and existing responsive widths.
- Existing tests that intentionally assert approved baseline values select
  Medium first; dedicated roast tests assert the new Dark default.
