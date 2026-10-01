# Implementation Plan: KamaCafe Baseline

**Branch**: `001-kamacafe-baseline` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-kamacafe-baseline/spec.md`

## Summary

Build KamaCafe as a mobile-first static single-page application using Vite 8,
Preact, strict TypeScript, and plain CSS. The build consumes `catalog.json` as
the only source of category and recipe content, resolves reusable base recipes,
and renders home, category, drink, and unavailable states from browser hash
routes. Terraform provisions an Amazon S3 website bucket and a proxied
Cloudflare CNAME. GitHub Actions validates, builds, and deploys the site.

## Technical Context

**Language/Version**: TypeScript 5.x in strict mode on Node.js 24 LTS; HTML5;
modern CSS; Terraform 1.x

**Primary Dependencies**: Vite 8, Preact 10, `@preact/preset-vite`; no router,
state-management library, component library, or server framework

**Storage**: Version-controlled `catalog.json`, catalog ID registry, and PNG
assets; compiled static assets in Amazon S3; no database

**Testing**: TypeScript type checking, Vitest for catalog/domain behavior,
Playwright for Chromium and WebKit flows, `@axe-core/playwright` for WCAG
checks, and Lighthouse CI for mobile performance budgets

**Target Platform**: Static web app on current and previous two major iOS
Safari releases and current Android Chrome; latest stable desktop Chrome and
Safari are primary desktop targets

**Project Type**: Client-only static single-page web application plus Terraform
infrastructure

**Performance Goals**: Essential drink guidance usable within 3 seconds on a
mid-range phone over typical 4G in at least 9 of 10 production measurements;
Lighthouse mobile performance score at least 90; no guidance waits on images

**Constraints**: No SSR or application server; browser-native hash routing;
320-1440 px responsive layouts without horizontal scrolling; public-read S3
website origin behind Cloudflare Flexible TLS; US English; explicit g, mL, mg,
and °C units; content remains usable when images fail

**Scale/Scope**: Three primary views plus unavailable state, 2 current
categories, 11 current drinks, one recursively resolvable recipe inheritance
graph, and catalog-driven growth without hard-coded category or drink counts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Design evidence | Status |
|---|---|---|
| Useful Brewing Guidance | Catalog schema and semantic validation require complete inherited coffee, water/yield, grind, temperature, ingredient, unit, caffeine, and ordered-step guidance. | PASS |
| Simplicity, Beauty, and Speed | Client-only Preact/Vite build, browser-native hash routing, plain CSS, no UI kit, no server, and no runtime data service. | PASS |
| Mobile Usability | Mobile-first Cocoa layout, 44 px targets, semantic controls, 320 px minimum width, Playwright mobile projects, keyboard checks, and overflow assertions. | PASS |
| Open Collaboration | App exposes repository and contribution links; quickstart and CI commands are public and reproducible. | PASS |
| Maintainable Changes | Strict types, JSON Schema plus semantic catalog validation, focused unit tests, cross-browser flows, and updated contributor validation steps. | PASS |
| Static Hosting | Vite emits static files to S3; Cloudflare provides the custom domain, edge TLS, proxying, and caching without an application server. | PASS |
| Secrets | AWS uses GitHub OIDC; the scoped Cloudflare API token and Terraform state remain outside the repository. | PASS |

**Post-design re-check**: PASS. Phase 1 introduces only contracts and
verification needed to enforce specification requirements. The accepted direct
Cloudflare-to-S3 design leaves the edge-to-origin hop on HTTP because S3
website endpoints do not support HTTPS; the origin contains public, read-only
assets and no user or secret data.

## Project Structure

### Documentation (this feature)

```text
specs/001-kamacafe-baseline/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── app-contract.md
│   ├── catalog.schema.json
│   ├── catalog-id-registry.schema.json
│   └── deployment-contract.md
└── tasks.md                         # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
catalog.json                         # Recipe content source of truth
catalog-id-registry.json             # Active and retired stable IDs
images/                              # Source PNGs; moved to public/images at implementation
public/
└── images/                          # Deployed /images/{drink-id}.png assets
src/
├── app.tsx                          # Route-to-view composition
├── main.tsx                         # Browser entry point
├── catalog/
│   ├── load.ts                      # Typed catalog import and lookup indexes
│   ├── resolve-recipe.ts            # Recursive inheritance resolution
│   ├── types.ts
│   └── validate.ts                  # Semantic publication validation
├── routing/
│   ├── hash-route.ts
│   └── use-hash-route.ts
├── components/
│   ├── app-header.tsx
│   ├── back-link.tsx
│   ├── category-card.tsx
│   ├── drink-row.tsx
│   └── recipe-panels.tsx
├── views/
│   ├── home-view.tsx
│   ├── category-view.tsx
│   ├── drink-view.tsx
│   └── unavailable-view.tsx
└── styles/
    ├── tokens.css
    └── app.css
scripts/
└── validate-catalog.ts
tests/
├── unit/
│   ├── catalog-validation.test.ts
│   ├── recipe-resolution.test.ts
│   └── hash-route.test.ts
├── e2e/
│   ├── navigation.spec.ts
│   ├── responsive-accessibility.spec.ts
│   └── media-failure.spec.ts
└── performance/
    └── lighthouserc.json
infra/
├── versions.tf
├── variables.tf
├── main.tf
├── outputs.tf
└── README.md
.github/workflows/
├── ci.yml
└── deploy.yml
```

**Structure Decision**: Use one small frontend project with domain logic grouped
by catalog and routing concerns. Keep view components shallow and style them
with shared CSS tokens. Keep infrastructure in a single Terraform root because
there is one production site and two providers. Preserve `catalog.json` at the
repository root so content updates remain obvious; the build imports it
directly. Serve PNGs from `public/images` at the paths required by the visual
specification.

## Maintenance Design: Long Recipe Guidance

### Consumer problem

`waterGuidance` is sentence-length prose, but the drink view currently renders
it in the same two-column fact row used for short values such as `18 g` and
`93°C`. At narrow widths, the value's content-sized grid track compresses the
label track until the two texts visually collide. The espresso recipe supplies
this value to every espresso-derived drink, so one layout defect appears on
multiple recipe pages.

### Design decision

- Keep compact ingredient and setting rows in their current two-column layout.
- Mark the `waterGuidance` setting as prose in the local presentation model in
  `src/components/recipe-panels.tsx`; do not infer layout from string length or
  catalog wording.
- Render prose rows with a dedicated modifier class. In `src/styles/app.css`,
  make that modifier a single-column row with a small label-to-value gap, a
  full-width value, and left-aligned wrapped text at every viewport size.
- Do not change recipe data, inheritance, semantic `dl`/`dt`/`dd` markup, or
  the layout of short values.

This is the smallest targeted correction. A global mobile breakpoint that
stacks every fact row would reduce scanability for compact values, while a
`:last-child` selector or character-count heuristic would couple layout to the
current ordering or copy.

### Test-first implementation sequence

1. Extend `tests/e2e/responsive-accessibility.spec.ts` with a representative
   espresso-derived recipe check at 320, 390, 430, 680, and 1440 CSS pixels.
   For the water-guidance row, assert that the label ends before the value
   begins vertically, the value remains within the row's horizontal bounds,
   the complete guidance is visible, and the document has no overflow. Confirm
   the new check fails against the current two-column layout.
2. Add an explicit prose-row discriminator to the component's local settings
   model and apply the modifier only to `waterGuidance`.
3. Add the single-column, left-aligned prose-row CSS while retaining the
   existing compact-row rules.
4. Run type checking, unit tests, the focused responsive Playwright test, and
   the full cross-browser E2E suite. Manually inspect one base espresso guide
   and one inherited milk-drink guide at a phone width.

### Acceptance criteria

- Water-guidance labels and values never overlap or obscure one another from
  320 through 1440 CSS pixels in the supported Chromium and WebKit projects.
- The full guidance remains visible, wraps within the panel, and preserves its
  semantic label/value relationship.
- Compact quantities and settings retain their existing two-column alignment.
- Espresso, all espresso-derived recipes, and brewed recipes continue to show
  unchanged catalog content and inherited values.

### Constitution re-check

PASS. The fix makes essential brewing guidance readable on mobile, adds a
focused automated regression, preserves the catalog model and static runtime,
and introduces no dependency or abstraction beyond a local presentation flag.
