---

description: "Dependency-ordered implementation tasks for the KamaCafe baseline"
---

# Tasks: KamaCafe Baseline

**Input**: Design documents from `/specs/001-kamacafe-baseline/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `/specs/visual-spec.md`, and `/.specify/memory/constitution.md`

**Tests**: Tests are required and follow strict TDD ordering: create the listed failing test or acceptance check before its corresponding implementation task.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested as an increment. The committed `catalog.json` is approved seed data; implementation validates it but does not reopen editorial review. Visual verification covers responsive behavior and accessibility, not screenshot comparison.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because the task changes different files and does not depend on another incomplete task in the same wave
- **[Story]**: Maps the task to a user story from `spec.md`
- Every task names the exact file or file set it changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Node, Vite, Preact, TypeScript, browser-test, and static-asset project structure.

- [ ] T001 Define Node.js 24 LTS, Vite 8, Preact 10, strict TypeScript, Ajv JSON Schema validation, Vitest, Playwright, `@axe-core/playwright`, and Lighthouse CI dependencies plus `validate:catalog`, `typecheck`, `test`, `build`, `preview`, `test:e2e`, and `test:performance` scripts in `package.json`
- [ ] T002 [P] Enable strict TypeScript, JSON imports, Preact JSX, browser libraries, and separate application/test includes in `tsconfig.json`
- [ ] T003 [P] Configure the Preact preset and static Vite build in `vite.config.ts`
- [ ] T004 [P] Add the accessible application mount point, viewport metadata, US-English language, and KamaCafe title in `index.html`
- [ ] T005 [P] Configure Mobile Safari, Mobile Chrome, desktop Chromium, and desktop WebKit projects against the Vite preview server in `playwright.config.ts`
- [ ] T006 [P] Move the eleven approved transparent drink assets from `images/{drink-id}.png` to their deployable paths at `public/images/{drink-id}.png`
- [ ] T007 [P] Ignore dependencies, Vite output, Playwright/Lighthouse artifacts, local Terraform state and plans, and local production variable files in `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Test first, then implement the typed catalog, reusable recipe resolution, semantic publication validation, stable-ID registry, and hash grammar used by every story.

**TDD gate**: T008-T012 MUST be added and observed failing before T013-T018 are implemented.

- [ ] T008 [P] Add failing schema and semantic tests for Catalog (`categories`: "Required, non-empty, source order is display order"; `drinks`: "Required, non-empty, source order is category display order after filtering"), Category (`id`: "Required; `^[a-z0-9]+(?:-[a-z0-9]+)*$`; unique among categories; registered and never reused"; `name`: "Required, non-blank US English display name"; `description`: "Required, non-blank short description"), and Drink (`id`: "Required; same slug rule; unique among drinks; registered and never reused"; `name`: "Required, non-blank display name"; `header`: "Required one-line description"; `category`: "Must resolve to exactly one category"; `servingSizeMl` type "positive number" and rule "Required; displayed with mL"; `prepTimeMinutes` type "positive number" and rule "Required; displayed in minutes"; `difficulty`: "Required"; `caffeine`: "Required"; `recipe`: "Required; must resolve to complete brewing guidance") in `tests/unit/catalog-validation.test.ts`
- [ ] T009 [P] Extend the failing validation matrix for Difficulty (`level` enum "`Easy | Moderate | Advanced`" and rule "Required"; `reason`: "Required, non-blank brief explanation"), CaffeineEstimate (`minMg` type "non-negative number" and rule "Required; not greater than `maxMg`"; `maxMg` type "non-negative number" and rule "Required; not less than `minMg`"; `note`: "Required assumption or variability explanation"; `sourceUrls`: "Required, non-empty, HTTPS sources"), Ingredient (`name`: "Required, non-blank"; `quantity` type "positive number or QuantityRange" and rule "Required; range may start at zero for an optional ingredient"; `unit` enum "`g | mL | filter`" and rule "Required; mass uses g and liquid uses mL"; `temperatureC`: "Required for milk and for ingredients whose usable temperature matters"; `optional`: "Defaults to false"; `note`: "Assumption or usage guidance; non-blank when present"), and QuantityRange (`min` type "non-negative number" and rule "Required; less than or equal to `max`"; `max` type "positive number" and rule "Required; greater than or equal to `min`") in `tests/unit/catalog-validation.test.ts`
- [ ] T010 [P] Add failing inheritance and completeness tests for Recipe (`baseRecipeId`: "Must resolve; must not refer to self or form a cycle"; `ingredients`: "Required; local ingredients in display order"; `grind`: "Required after inheritance resolution"; `waterTemperatureC`: "Required after resolution; displayed with °C"; `espressoYieldG`: "Alternative output target for espresso recipes; displayed with g"; `waterGuidance`: "Required when water amount is represented by reservoir/yield guidance rather than an ingredient amount"; `steps`: "Required, non-empty, ordered, non-blank") and for `ResolvedRecipe` lineage, ancestor-first ingredients/steps, nearest scalar inheritance, missing bases, self-references, and cycles in `tests/unit/recipe-resolution.test.ts`
- [ ] T011 [P] Add failing stable-ID tests for CatalogIdRecord (`id`: "Required slug; unique within `kind`; immutable"; `kind` enum "`category | drink`" and rule "Required; immutable"; `introducedAs`: "Required audit label; does not constrain later display-name changes"; `status` enum "`active | retired`" and rule "Required; retirement is one-way") including active current IDs, absent retired IDs, and rejection of retired-ID reuse in `tests/unit/catalog-validation.test.ts`
- [ ] T012 [P] Add failing route grammar tests for empty or `#` home hashes, `#category-{category-id}`, `#{drink-id}`, and unrecognized hashes in `tests/unit/hash-route.test.ts`
- [ ] T013 [P] Define immutable `Catalog`, `Category`, `Drink`, `Difficulty`, `CaffeineEstimate`, `Recipe`, `Ingredient`, `QuantityRange`, `ResolvedRecipe`, and `AppRoute` types matching the tested constraints in `src/catalog/types.ts`
- [ ] T014 [P] Seed every approved category and drink ID as an active immutable record conforming to `contracts/catalog-id-registry.schema.json` in `catalog-id-registry.json`
- [ ] T015 Implement depth-first base-recipe resolution with a visited-ID set, ancestor-first arrays, nearest-value scalar inheritance, source wording preservation, and non-mutating results in `src/catalog/resolve-recipe.ts`
- [ ] T016 Implement JSON Schema and semantic publication validation for uniqueness, references, cycles, resolved guidance, range ordering, units, milk temperature, caffeine ordering, matching images, and stable-ID rules in `src/catalog/validate.ts`
- [ ] T017 Build validated catalog imports plus category, drink, and resolved-recipe lookup indexes without hard-coded counts or names in `src/catalog/load.ts`
- [ ] T018 Implement the tested pure hash parser and formatter without a routing dependency in `src/routing/hash-route.ts`
- [ ] T019 Expose publication validation as a nonzero-on-error build gate that reads `catalog.json`, `catalog-id-registry.json`, both contract schemas, and `public/images/` in `scripts/validate-catalog.ts`

**Checkpoint**: `npm run validate:catalog`, `npm run typecheck`, and the foundational Vitest suite pass against the approved seed catalog before any view work begins.

---

## Phase 3: User Story 1 - Choose a Method and Brew (Priority: P1) 🎯 MVP

**Goal**: A visitor can select any published category and drink and receive complete, resolved brewing guidance from the catalog.

**Independent Test**: Starting at `/`, choose each category and at least one drink in each; verify catalog order, name, description, time, difficulty, serving size, caffeine estimate, ingredients/settings with explicit units, and complete ordered steps, including inherited espresso guidance and milk fields only where applicable.

**TDD gate**: T020 MUST be added and observed failing before T021-T032 are implemented.

### Tests for User Story 1

- [ ] T020 [US1] Add a failing Playwright core journey covering every home category, catalog-ordered drink lists, an espresso-derived drink, a brewed drink, explicit g/mL/mg/°C output, ranges/assumptions, and omission of milk fields for non-milk drinks in `tests/e2e/navigation.spec.ts`

### Implementation for User Story 1

- [ ] T021 [P] [US1] Define the Cocoa palette, typography, spacing, radii, focus, surface, and content-width custom properties from `specs/visual-spec.md` in `src/styles/tokens.css`
- [ ] T022 [P] [US1] Implement the decorative bean mark and exact “KamaCafé - Brew the perfect cup” shared header in `src/components/app-header.tsx`
- [ ] T023 [P] [US1] Implement a semantic 48-pixel-minimum anchor for home/category navigation labels in `src/components/back-link.tsx`
- [ ] T024 [P] [US1] Implement a full-card category anchor driven only by category name, description, and stable ID in `src/components/category-card.tsx`
- [ ] T025 [P] [US1] Implement a full-row drink anchor with decorative `/images/{drink.id}.png`, preparation time, difficulty, and stable-ID link in `src/components/drink-row.tsx`
- [ ] T026 [P] [US1] Render resolved ingredients, grind, water or espresso-yield guidance, all applicable temperatures, caffeine, serving size, and an ordered step list with explicit units in `src/components/recipe-panels.tsx`
- [ ] T027 [US1] Render the catalog-driven “What are we brewing?” category selection and supporting copy in `src/views/home-view.tsx`
- [ ] T028 [US1] Render the selected category name, computed count, back link, and catalog-ordered drink rows in `src/views/category-view.tsx`
- [ ] T029 [US1] Render the selected drink hero, decorative image, facts, resolved “What you need,” and complete “How to make it” guidance in `src/views/drink-view.tsx`
- [ ] T030 [US1] Compose header and the home, category, and drink states from validated catalog lookups in `src/app.tsx`
- [ ] T031 [US1] Mount the Preact application and import shared styles in `src/main.tsx`
- [ ] T032 [US1] Implement the mobile-first Cocoa shell, stacked home cards, single-column drink rows, recipe hero, panels, wrapping, transparent-image containment, and 680-pixel two-column enhancements in `src/styles/app.css`

**Checkpoint**: User Story 1 passes its Playwright journey independently and provides enough information to brew any approved catalog drink.

---

## Phase 4: User Story 2 - Share a Drink Guide (Priority: P2)

**Goal**: Stable category and drink addresses work on selection, fresh visits, refresh, Back/Forward, rename-safe IDs, and unknown/retired links.

**Independent Test**: Open `/#category-espresso-drink` and `/#espresso` in fresh contexts, refresh, traverse Back/Forward, and visit unknown category, drink, and retired-ID hashes; the URL and rendered view remain synchronized and unavailable links lead home.

**TDD gate**: T033 MUST be added and observed failing before T034-T037 are implemented.

### Tests for User Story 2

- [ ] T033 [US2] Extend the failing browser suite with category/drink address updates, fresh direct loads, refresh, renamed display text with stable IDs, Back/Forward synchronization, unknown hashes, retired IDs, home recovery, and scroll-to-top assertions in `tests/e2e/navigation.spec.ts`

### Implementation for User Story 2

- [ ] T034 [P] [US2] Implement the browser-native `hashchange` subscription, initial route resolution, and cleanup around the pure route parser in `src/routing/use-hash-route.ts`
- [ ] T035 [P] [US2] Implement the clear unavailable-page heading, requested-link explanation, and semantic home anchor in `src/views/unavailable-view.tsx`
- [ ] T036 [US2] Resolve known category/drink IDs, reject unknown and retired IDs, and preserve stable-ID semantics without name-based fallback in `src/routing/hash-route.ts`
- [ ] T037 [US2] Make URL state authoritative, render the unavailable state, and scroll completed view transitions to the top without stealing active focus in `src/app.tsx`

**Checkpoint**: Every designated address behaves correctly in a fresh session and browser history never diverges from the displayed view.

---

## Phase 5: User Story 3 - Brew on a Phone (Priority: P2)

**Goal**: Home, category, drink, and unavailable views remain readable and operable on narrow touch screens, by keyboard, and when decorative media fails.

**Independent Test**: Complete the core flow at 320, 390, 430, 680, and 1440 CSS pixels in mobile and desktop browser projects; verify no horizontal document overflow, at least 44×44-pixel controls, visible keyboard focus, logical headings, axe WCAG 2.2 A/AA results, reduced-motion handling, and usable text while PNG requests are blocked.

**TDD gate**: T038-T040 MUST be added and observed failing before T041-T043 are implemented.

### Tests for User Story 3

- [ ] T038 [P] [US3] Add failing responsive and accessibility tests for all four views, five required widths, logical headings, semantic anchors/lists, keyboard flow, visible focus, 44×44-pixel targets, contrast-facing axe WCAG 2.2 A/AA checks, and no horizontal overflow in `tests/e2e/responsive-accessibility.spec.ts`
- [ ] T039 [P] [US3] Add a failing browser scenario that blocks every PNG request and verifies the category choices, recipe facts, ingredients, settings, and ordered steps remain usable in `tests/e2e/media-failure.spec.ts`
- [ ] T040 [P] [US3] Configure repeated mobile Lighthouse runs with performance score at least 90, a three-second essential-guidance target, and explicit static-asset budgets in `tests/performance/lighthouserc.json`

### Implementation for User Story 3

- [ ] T041 [US3] Harden layout from 320 through 1440 pixels with wrapping, 44×44-pixel targets, visible focus, AA Cocoa color pairings, reduced-motion overrides, bounded transparent media, two-column enhancements, and no horizontal overflow in `src/styles/app.css`
- [ ] T042 [P] [US3] Ensure category and drink controls expose complete text labels while their images remain decorative and missing images cannot remove link content in `src/components/category-card.tsx` and `src/components/drink-row.tsx`
- [ ] T043 [P] [US3] Ensure the drink hero and recipe panels use one logical `h1`, ordered steps, textual fact labels, preserved reading order, and guidance independent of the hero image in `src/views/drink-view.tsx` and `src/components/recipe-panels.tsx`

**Checkpoint**: Responsive, keyboard, axe, media-failure, and Lighthouse checks pass without screenshot-regression tooling.

---

## Phase 6: User Story 4 - Improve the Guide (Priority: P3)

**Goal**: Visitors can reach the public repository and complete instructions for reporting issues or proposing recipes and code changes.

**Independent Test**: From the built app, follow the repository and contribution links; verify the instructions describe issue reports, required recipe fields/units, stable IDs, validation commands, pull requests, and constitution-based review.

**TDD gate**: T044 MUST be added and observed failing before T045-T049 are implemented.

### Tests for User Story 4

- [ ] T044 [US4] Add a failing browser test for visible, keyboard-operable public repository and contribution links with correct build-time URLs in `tests/e2e/contribution-links.spec.ts`

### Implementation for User Story 4

- [ ] T045 [P] [US4] Document issue reports, required recipe details and units, immutable ID registration, local validation, pull-request verification, and constitution review criteria in `CONTRIBUTING.md`
- [ ] T046 [P] [US4] Validate required `VITE_REPOSITORY_URL` and `VITE_CONTRIBUTING_URL` values and expose them to UI code in `src/config.ts`
- [ ] T047 [P] [US4] Implement a semantic site footer with repository, issue, and contribution links sourced from validated configuration in `src/components/site-footer.tsx`
- [ ] T048 [US4] Add the contribution footer to every rendered app state in `src/app.tsx`
- [ ] T049 [US4] Add project purpose, prerequisites, local commands, public project links, deployment overview, and contributor entry points in `README.md`

**Checkpoint**: A visitor can move from the deployed app to public issue and pull-request instructions without maintainer assistance.

---

## Phase 7: Production Delivery, Polish & Cross-Cutting Concerns

**Purpose**: Validate every story in CI, provision the contracted S3/Cloudflare infrastructure, perform the authorized production deployment, and record release evidence.

- [ ] T050 [P] Pin Terraform and compatible AWS/Cloudflare provider requirements plus the encrypted/versioned S3 backend contract with native lockfiles in `infra/versions.tf`
- [ ] T051 [P] Declare typed non-secret `site_hostname`, `aws_region`, `cloudflare_zone_id`, `github_repository`, cache TTL, Terraform-state, and common-tag inputs with validations in `infra/variables.tf`
- [ ] T052 Provision the hostname-named versioned/encrypted public-read S3 website, least-privilege GitHub OIDC deployment role, proxied Cloudflare CNAME, Flexible TLS, HTTPS redirect, and hostname-scoped cache rules in `infra/main.tf`
- [ ] T053 Expose only the S3 website endpoint, canonical HTTPS URL, bucket name, and deployment role ARN in `infra/outputs.tf`
- [ ] T054 Document state-bucket prerequisites, non-secret production inputs, Cloudflare token scope, OIDC trust, plan/apply commands, accepted HTTP edge-to-origin limitation, rollback, and teardown safeguards in `infra/README.md`
- [ ] T055 [P] Run catalog validation, type checking, Vitest, production build, Playwright/axe, Lighthouse, `terraform fmt -check`, and `terraform validate` on pull requests in `.github/workflows/ci.yml`
- [ ] T056 Build once on `main`, assume AWS via OIDC, require the protected production environment before Terraform apply, upload immutable assets before revalidating `index.html`, set contracted cache headers/content types, purge changed stable images, and inject canonical repository links in `.github/workflows/deploy.yml`
- [ ] T057 [P] Add a non-secret, documented production input template for the custom domain, AWS region, Cloudflare zone, GitHub repository, cache settings, and common tags in `infra/production.tfvars.example`
- [ ] T058 Synchronize all implemented install, validation, browser, performance, infrastructure, deployment, and smoke-test commands with the shipped scripts in `specs/001-kamacafe-baseline/quickstart.md`
- [ ] T059 Run all local quality gates plus `terraform init -backend=false`, format check, validation, and production plan; record commands, versions, results, and reviewed plan summary in `specs/001-kamacafe-baseline/deployment-validation.md`
- [ ] T060 Configure the protected GitHub production environment, scoped Cloudflare token, AWS OIDC trust, approved non-secret variables, and remote Terraform state prerequisites; record redacted configuration evidence in `specs/001-kamacafe-baseline/deployment-validation.md`
- [ ] T061 Execute the authorized production workflow through Terraform apply and static-asset publication, then record the canonical HTTPS URL and non-secret Terraform outputs in `specs/001-kamacafe-baseline/deployment-validation.md`
- [ ] T062 Verify `/`, `/#category-espresso-drink`, `/#espresso`, refresh/history behavior, contracted cache headers, one espresso-based guide, and one brewed guide on a real phone; run ten cold mobile measurements and record at least nine visits with essential guidance usable within three seconds in `specs/001-kamacafe-baseline/production-smoke.md`
- [ ] T063 Complete the release check in current Safari with keyboard navigation and VoiceOver across home, category, drink, unavailable, and contribution paths; record results and any approved exceptions in `specs/001-kamacafe-baseline/production-smoke.md`

**Checkpoint**: The custom-domain production site, delivery workflow, cache behavior, responsive/accessibility checks, real-device flows, and 9-of-10 performance target are verified with durable evidence.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies; T002-T007 can proceed in parallel after T001 establishes dependency names and scripts.
- **Phase 2 — Foundational**: Depends on Setup. Complete all failing tests T008-T012 before implementing T013-T019. This phase blocks every user story.
- **Phase 3 — User Story 1**: Depends on Foundational and supplies the MVP view flow.
- **Phase 4 — User Story 2**: Depends on the User Story 1 views it makes directly addressable; its test is written before URL-state integration.
- **Phase 5 — User Story 3**: Depends on User Story 1 view markup; it can run in parallel with User Story 2 after the MVP views exist.
- **Phase 6 — User Story 4**: Depends on the shared shell from User Story 1; it can run in parallel with User Stories 2 and 3.
- **Phase 7 — Production Delivery**: Infrastructure code and CI can start after Foundational, but T061-T063 require all selected stories, local validation, reviewed infrastructure, production approvals, and credentials.

### User Story Dependency Graph

```text
Setup → Foundational → US1 (MVP)
                         ├──→ US2 ──┐
                         ├──→ US3 ──┼──→ Production Delivery
                         └──→ US4 ──┘
```

### Within Each User Story

1. Add the story's specified test tasks and confirm they fail for the intended missing behavior.
2. Implement independent components/files marked `[P]` in parallel.
3. Compose views and shared application behavior after their components exist.
4. Re-run the story-specific tests until they pass before advancing the story checkpoint.
5. Preserve earlier story tests as regression coverage.

### Parallel Opportunities

- Setup configuration and static asset tasks T002-T007 modify separate files.
- Foundational constraint, resolver, registry, and route tests T008-T012 can be authored concurrently before implementation.
- User Story 1 tokens and leaf components T021-T026 can be implemented concurrently, followed by parallel view work where dependencies permit.
- After User Story 1, User Stories 2, 3, and 4 may proceed concurrently.
- User Story 3 test files T038-T040 and its markup hardening tasks T042-T043 are separate-file work.
- Terraform declarations T050-T051, CI T055, and production input documentation T057 can proceed concurrently before the deployment workflow is finalized.

---

## Parallel Execution Examples

### User Story 1

```text
Task T021: Define Cocoa tokens in src/styles/tokens.css
Task T022: Implement shared header in src/components/app-header.tsx
Task T023: Implement back link in src/components/back-link.tsx
Task T024: Implement category card in src/components/category-card.tsx
Task T025: Implement drink row in src/components/drink-row.tsx
Task T026: Implement recipe panels in src/components/recipe-panels.tsx
```

### User Story 2

```text
Task T034: Implement hash subscription in src/routing/use-hash-route.ts
Task T035: Implement unavailable view in src/views/unavailable-view.tsx
```

### User Story 3

```text
Task T038: Author responsive/axe tests in tests/e2e/responsive-accessibility.spec.ts
Task T039: Author media-failure tests in tests/e2e/media-failure.spec.ts
Task T040: Configure Lighthouse budgets in tests/performance/lighthouserc.json
```

### User Story 4

```text
Task T045: Write contributor instructions in CONTRIBUTING.md
Task T046: Implement public-link configuration in src/config.ts
Task T047: Implement contribution footer in src/components/site-footer.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Add T020 and verify the core Playwright journey fails for missing UI behavior.
3. Complete T021-T032.
4. Run catalog validation, type checking, unit tests, build, and the User Story 1 journey.
5. Stop at the User Story 1 checkpoint for an independently usable brewing-guide MVP.

### Incremental Delivery

1. Add User Story 2 and validate shareable links, refresh, browser history, and unavailable routes.
2. Add User Story 3 and validate responsive, accessibility, keyboard, media-failure, and performance behavior without screenshot comparison.
3. Add User Story 4 and validate the public collaboration path.
4. Complete infrastructure, CI, authorized apply, custom-domain deployment, and production evidence only after all selected story gates pass.

### TDD Discipline

- Never implement behavior covered by a listed test task until that test exists and fails for the expected reason.
- Keep domain tests deterministic and independent of Preact rendering.
- Use Playwright for real hash navigation, history, layout, touch/keyboard, media failure, and accessibility behavior.
- Do not alter approved recipe wording or values merely to satisfy a test; fix validation, resolution, formatting, or rendering behavior instead.

---

## Notes

- `[P]` means different files and no dependency on an incomplete task in the same execution wave.
- The existing `catalog.json` is approved seed content; validation tasks enforce its contract and future publication safety.
- Production apply and smoke tests require authorized AWS, Cloudflare, GitHub, domain, and real-device access; secrets and Terraform state never enter the repository.
- Visual acceptance is based on the responsive/accessibility criteria in `specs/visual-spec.md`, not pixel or screenshot comparison.
- Each checkbox retains a sequential ID, required story label where applicable, concrete action, and exact file path.
