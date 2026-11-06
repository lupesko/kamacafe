---

description: "Dependency-ordered implementation tasks for roast-aware brewing recommendations"
---

# Tasks: Roast-Aware Brewing Recommendations

**Input**: Design documents from `/specs/004-add-roast-recommendations/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Automated tests are required by the feature acceptance criteria and KamaCafe constitution. Write each story's tests first and confirm they fail for the intended reason before implementing that story.

**Organization**: Tasks are grouped by user story so each increment has an explicit independent test and traceable implementation scope.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks marked [P] in that phase because files and prerequisites do not conflict
- **[Story]**: Maps the task to US1, US2, US3, or US4 from [spec.md](./spec.md)
- Every checklist item names the files it changes or validates

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Activate the versioned feature contract without changing dependencies or project structure.

- [X] T001 Update `src/catalog/validate.ts` to compile `specs/004-add-roast-recommendations/contracts/catalog.schema.json` as the active catalog schema while retaining `specs/001-kamacafe-baseline/contracts/catalog-id-registry.schema.json` for stable IDs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the shared roast and temperature primitives used by every story.

**⚠️ CRITICAL**: No user-story implementation begins until this phase passes its focused unit tests and typecheck.

- [X] T002 Add failing unit coverage in `tests/unit/temperature-guidance.test.ts` for formatting numeric temperatures as `{value}°C`, ranges as `{min}–{max}°C`, structural equality, and rejection/handling of unordered or out-of-bounds ranges
- [X] T003 Add `RoastLevel = 'light' | 'medium' | 'dark'`, ordered roast constants, `TemperatureGuidance`, `RoastAdjustment`, `RoastRecommendation`, `RoastRecommendations`, and `ResolvedRoastRecommendation` to `src/catalog/types.ts`; model exact Light/Medium/Dark keys, 0–100°C targets, ordered ranges, four required explanation fields, optional nonempty adjustments, and resolved selected content
- [X] T004 Implement immutable `formatTemperatureGuidance` and `temperatureGuidanceEquals` helpers in `src/catalog/temperature-guidance.ts` and make `tests/unit/temperature-guidance.test.ts` pass without adding a dependency

**Checkpoint**: Shared types and range behavior compile and pass; the existing numeric catalog remains representable.

---

## Phase 3: User Story 1 - Choose a Roast for a Drink (Priority: P1) 🎯 MVP

**Goal**: Every drink guide offers Light, Medium, and Dark; Dark is the fresh-load default; changing the selection updates synchronized recipe facts and method steps while preserving unrelated values and the current serving multiplier.

**Independent Test**: Open Espresso, Pour-over, French press, and Turkish coffee; switch all three roast choices; verify checked state, temperature, grind, and method steps; navigate to another guide and confirm the choice persists; reload and confirm Dark resets.

### Tests for User Story 1

- [X] T005 [P] [US1] Add failing roast-selection and immutability cases to `tests/unit/recipe-resolution.test.ts` covering defaulted Medium resolution, explicit Light/Dark resolution, selected local steps, brew-ratio water-temperature synchronization, unchanged unrelated fields, and unmutated source recipes
- [X] T006 [P] [US1] Create failing core browser scenarios in `tests/e2e/roast-recommendations.spec.ts` for Dark on fresh load, native Light/Medium/Dark checked states, switching facts and steps, Medium baseline restoration, visit-wide in-app persistence, reload reset, and retained serving multiplier

### Implementation for User Story 1

- [X] T007 [US1] Add complete `light`, `medium`, and `dark` recommendation records to the four root recipes in `catalog.json`; keep Medium adjustments absent, add explicit Light/Dark grind/temperature/local-step overrides, use 90–91°C range data for Dark Espresso, and leave every derived recipe map-free
- [X] T008 [US1] Extend `resolveRecipe` in `src/catalog/resolve-recipe.ts` with a `RoastLevel` argument defaulting to `medium`; select root adjustments before combining lineage steps, append unchanged child steps, synchronize only the explicit brew-ratio water ingredient, attach `ResolvedRoastRecommendation`, and preserve input immutability
- [X] T009 [US1] Build typed roast-aware recipe lookups for every drink and all three levels in `src/catalog/load.ts` while retaining the existing catalog/category/drink indexes and synchronous build-time loading
- [X] T010 [US1] Add visit-wide `RoastLevel` state initialized to `dark` in `src/app.tsx`, select the matching resolved recipe, preserve the value across hash navigation and Back/Forward, and rely on remount for fresh-load reset without URL or browser storage changes
- [X] T011 [P] [US1] Create controlled native fieldset/radio UI for Light, Medium, and Dark plus selected recommendation content in `src/components/roast-selector.tsx`; expose checked state without color alone and keep option labels in canonical order
- [X] T012 [US1] Pass roast value and change callback through `src/views/drink-view.tsx`, render `src/components/roast-selector.tsx` inside the “What you need” flow, and keep the existing drink-keyed serving multiplier state independent of roast changes
- [X] T013 [US1] Update `src/components/recipe-panels.tsx` to render numeric or range temperatures through `src/catalog/temperature-guidance.ts` for ingredients and recipe facts while continuing to scale the already roast-resolved steps through the existing scaler
- [X] T014 [US1] Add Cocoa-consistent selector, selected-option, explanation-container, wrapping, focus, and minimum 44 px target styles to `src/styles/app.css` without changing `src/styles/tokens.css` or adding a breakpoint/dependency unless existing responsive rules cannot satisfy 320 px

**Checkpoint**: US1 works end to end on all four root methods; `tests/unit/recipe-resolution.test.ts` and the core `tests/e2e/roast-recommendations.spec.ts` scenarios pass.

---

## Phase 4: User Story 2 - Understand Why the Advice Changes (Priority: P1)

**Goal**: Each selected roast clearly explains flavor, extraction, temperature, and grind in beginner-friendly language, including why Turkish settings remain fixed, without adding cup troubleshooting.

**Independent Test**: Select every roast on a representative guide and verify four labelled explanation dimensions; then verify Turkish Light/Medium/Dark explicitly explain unchanged 20°C and extra-fine settings and no troubleshooting text appears.

### Tests for User Story 2

- [X] T015 [P] [US2] Add failing explanation-content scenarios to `tests/e2e/roast-recommendations.spec.ts` for all four labelled dimensions, changed-setting rationale, Turkish unchanged-setting rationale, immediate update with the selected radio, and absence of troubleshooting or “fix your cup” guidance

### Implementation for User Story 2

- [X] T016 [US2] Audit and revise all four root-method recommendation records in `catalog.json` so `flavor`, `extraction`, `temperatureExplanation`, and `grindExplanation` are nonblank US English, use plain beginner language, qualify recommendations as starting points, and explain both changed and method-fixed settings
- [X] T017 [US2] Refine `src/components/roast-selector.tsx` to present the selected roast name and all four explanation fields with semantic headings/label-value markup, concise visible copy, and no troubleshooting controls or follow-up adjustment behavior
- [X] T018 [US2] Refine explanation typography, dividers, wrapping, and selected-state hierarchy in `src/styles/app.css` to match the updated `specs/visual-spec.png` while keeping ingredients and steps visually primary

**Checkpoint**: US2 is understandable and independently demonstrable; explanation scenarios pass without requiring US3 publication enforcement or US4 regression coverage.

---

## Phase 5: User Story 3 - Receive Method-Appropriate Guidance (Priority: P2)

**Goal**: Published recommendations use the exact method-specific matrix, derived espresso drinks inherit Espresso guidance, and incomplete or conflicting method content cannot be published.

**Independent Test**: Resolve all four methods at all three levels and compare exact temperature/grind targets; verify Latte and Americano inherit selected Espresso steps/settings while milk and dilution water remain fixed; corrupt each contract rule and confirm catalog validation rejects it.

### Tests for User Story 3

- [X] T019 [P] [US3] Add failing contract cases to `tests/unit/catalog-validation.test.ts` for missing/extra roast keys, blank explanation fields, empty adjustments, Medium adjustments, invalid 0–100°C ranges, backward micron ranges, root maps missing, derived maps present, incomplete all-roast resolution, and mismatched brew-water ingredient temperatures
- [X] T020 [P] [US3] Add failing inheritance cases to `tests/unit/recipe-resolution.test.ts` for Latte and Americano selected Espresso settings/steps, unchanged 60°C milk and 85°C dilution water, unchanged child assembly steps, nested-lineage behavior, and Turkish fixed 20°C/~50–200 µm values with varying controlled-heating steps
- [X] T021 [P] [US3] Add parameterized failing browser cases to `tests/e2e/roast-recommendations.spec.ts` for every published drink at every Light, Medium, and Dark selection. Verify that every displayed temperature and grind value in recipe facts and roast-dependent preparation steps matches the selected resolved recipe, that no value from the previously selected roast remains visible, and that protected milk, chocolate, ice, dilution, assembly, and serving content remains unchanged. Include exact Espresso 94/93/90–91°C, Pour-over 96/94/90°C, French press 96/94/90°C, Turkish fixed-setting, and micron-range assertions

### Implementation for User Story 3

- [X] T022 [US3] Extend semantic publication checks in `src/catalog/validate.ts` to require one exact three-key map on every root and none on derived recipes, prohibit Medium adjustments, validate ordered grind/temperature ranges, resolve every drink at all three levels, compare brew-water temperatures structurally, enforce nonempty variant steps, and reject incomplete guidance before build
- [X] T023 [P] [US3] Update recipe contribution requirements in `CONTRIBUTING.md` to require all three root-method roast profiles, four explanation fields, evidence for changed brewing guidance, exact units/ranges, Medium compatibility, inherited derived guidance, and validation across every roast

**Checkpoint**: US3's exact matrix, inheritance, and publication failures pass independently against the implemented selector/resolver foundation.

---

## Phase 6: User Story 4 - Keep Existing Workflows Intact (Priority: P2)

**Goal**: Navigation, shared links, scaling, optional-media failure, accessibility, responsive layout, and existing baseline behavior remain intact around the new visit-wide roast state.

**Independent Test**: Scale a recipe before and after changing roast; traverse direct links and Back/Forward; reload; operate radios by keyboard/touch at 320–1440 px; abort images; run axe; verify every established flow still produces its contracted result except the intentional Dark default.

### Tests for User Story 4

- [X] T024 [P] [US4] Add failing regression scenarios to `tests/e2e/roast-recommendations.spec.ts` for change-order equivalence, two-serving Pour-over quantities with selected temperatures/steps, rapid option changes, in-app category/drink navigation, Back/Forward persistence, shared-address Dark default, and reload reset
- [X] T025 [P] [US4] Extend `tests/e2e/responsive-accessibility.spec.ts` with radio keyboard/checked-state/focus checks, axe coverage, 44 × 44 CSS-pixel label targets, explanation geometry, and no horizontal overflow at 320, 390, 430, 680, and 1440 px
- [X] T026 [P] [US4] Extend `tests/e2e/media-failure.spec.ts` to abort images and assert the Dark-default selector, four explanations, synchronized facts, and preparation steps remain usable
- [X] T027 [P] [US4] Update approved-baseline assertions in `tests/e2e/navigation.spec.ts` and `tests/e2e/recipe-scaling.spec.ts` to select Medium explicitly before checking legacy values, while retaining dedicated Dark-default assertions in `tests/e2e/roast-recommendations.spec.ts`
- [X] T028 [P] [US4] Add failing resolve-before-scale and immutability cases to `tests/unit/recipe-scaling.test.ts` covering quantity scaling, selected step text, unchanged temperature ranges/grind/explanations, and cloned roast metadata

### Implementation for User Story 4

- [X] T029 [US4] Update `src/catalog/scale-recipe.ts` to preserve and immutably clone selected roast metadata and numeric/range temperature guidance while continuing to scale only quantities, espresso yield, water guidance, and g/mL step mentions
- [X] T030 [US4] Apply any selector focus, touch-target, wrapping, and narrow/wide layout corrections required by the new accessibility tests in `src/styles/app.css` without weakening existing recipe-panel, hero, image-failure, or reduced-motion behavior

**Checkpoint**: US4 and the full existing unit/E2E suite pass across configured Chromium/WebKit projects with no route, scaling, media, accessibility, or responsive regressions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Align durable documentation and execute the full release-quality validation matrix.

- [X] T031 [P] Update `README.md` to describe the Light/Medium/Dark selector, Dark fresh-load default, visit-wide in-memory behavior, root-recipe inheritance, and unchanged static/no-account architecture
- [X] T032 [P] Update `specs/visual-spec.md` Drink-view and accessibility sections to match `specs/visual-spec.png`, including native roast controls, four explanation dimensions, Dark selected state, synchronized facts/steps, and 320 px wrapping expectations
- [X] T033 Run `npm run validate:catalog`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` exactly as documented in `specs/004-add-roast-recommendations/quickstart.md`; record the completed automated verification and any supported-environment caveats in that file
- [ ] T034 Run `npm run test:performance`; execute 100 measured roast changes on the pinned reference phone or emulated device profile after one warm-up interaction; record the device model or emulation settings, OS and browser versions, timing method, raw pass count, and whether the 95-of-100 one-second threshold passes. Also perform the quickstart's current-Safari keyboard and VoiceOver checks and record whether the existing 3-second guidance, accessibility, and no-overflow targets pass in `specs/004-add-roast-recommendations/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately; activates the versioned schema.
- **Foundational (Phase 2)**: Depends on T001 and blocks every user story.
- **US1 (Phase 3)**: Depends on the foundation and delivers the MVP selector, state, data, resolution, and synchronized display.
- **US2 (Phase 4)**: Depends on US1's selector and catalog records; can proceed before US3 validation hardening.
- **US3 (Phase 5)**: Depends on US1's resolver/catalog shape; can run in parallel with US2 after US1 if contributors avoid `catalog.json` conflicts.
- **US4 (Phase 6)**: Depends on US1 and should run after desired US2/US3 behavior is integrated so it protects the complete release.
- **Polish (Phase 7)**: Depends on all selected stories.

### User Story Dependency Graph

```text
Setup → Foundation → US1 (MVP)
                         ├──→ US2
                         └──→ US3
                                \
                         US2 ────→ US4 → Polish
```

### Within Each User Story

- Write the listed tests first and confirm the intended failure.
- Add or refine catalog content before resolution/presentation code that consumes it.
- Complete pure model/resolver behavior before UI integration.
- Complete core implementation before cross-browser and regression checkpoints.
- Do not introduce a dependency, route, storage mechanism, service, or troubleshooting UI.

### Parallel Opportunities

- US1 unit and browser tests (T005–T006) can be authored in parallel; T011 can be developed independently after foundational types exist.
- US3 validation, inheritance, and browser tests (T019–T021) can be authored in parallel; contributor documentation (T023) can proceed alongside validator implementation.
- US4 browser/accessibility/media/baseline/unit test changes (T024–T028) touch separate files and can proceed in parallel.
- README and visual-spec documentation (T031–T032) can proceed in parallel after behavior stabilizes.

## Parallel Example: User Story 1

```text
Task T005: Add roast-resolution unit tests in tests/unit/recipe-resolution.test.ts
Task T006: Add core browser journeys in tests/e2e/roast-recommendations.spec.ts
Task T011: Build the controlled selector in src/components/roast-selector.tsx after Phase 2
```

## Parallel Example: User Story 2

```text
Task T015: Add explanation-content browser tests in tests/e2e/roast-recommendations.spec.ts
After T015 fails, implement T016–T018 sequentially because catalog copy, markup, and CSS form one visible contract.
```

## Parallel Example: User Story 3

```text
Task T019: Add publication validation failures in tests/unit/catalog-validation.test.ts
Task T020: Add inherited recipe cases in tests/unit/recipe-resolution.test.ts
Task T021: Add method-matrix browser cases in tests/e2e/roast-recommendations.spec.ts
Task T023: Document contributor requirements in CONTRIBUTING.md
```

## Parallel Example: User Story 4

```text
Task T024: Add navigation/scaling lifecycle cases in tests/e2e/roast-recommendations.spec.ts
Task T025: Extend responsive/accessibility checks in tests/e2e/responsive-accessibility.spec.ts
Task T026: Extend image-failure coverage in tests/e2e/media-failure.spec.ts
Task T027: Preserve baseline assertions in tests/e2e/navigation.spec.ts and tests/e2e/recipe-scaling.spec.ts
Task T028: Add scaling composition tests in tests/unit/recipe-scaling.test.ts
```

## Implementation Strategy

### MVP First: User Story 1

1. Complete T001–T004.
2. Write and observe failures for T005–T006.
3. Complete T007–T014.
4. Run the US1 focused unit and Playwright scenarios.
5. Demo Dark default, all three choices, synchronized facts/steps, visit-wide navigation, reload reset, and preserved servings before expanding scope.

### Incremental Delivery

1. **Foundation**: Versioned schema, types, temperature ranges.
2. **US1 MVP**: Selection, data, resolution, state, and synchronized display.
3. **US2**: Beginner explanation quality and method-fixed rationale.
4. **US3**: Exact method matrix, inheritance guarantees, publication rejection.
5. **US4**: Full navigation/scaling/accessibility/media/performance protection.
6. **Polish**: Documentation and release-quality verification.

### Parallel Team Strategy

After US1 stabilizes, one contributor can complete explanation presentation
(US2) while another completes semantic catalog validation and method/derived
coverage (US3). Merge both before US4 regression hardening to avoid duplicating
test maintenance in shared browser files.

## Notes

- Every task is scoped to the existing static Preact project and exact paths.
- `[P]` tasks are safe to parallelize only within the dependency rules above.
- Medium is the compatibility baseline; Dark is the fresh-load product default.
- Recommendation resolution occurs before serving scaling.
- Root recipes own roast maps; derived recipes inherit and preserve local content.
- Commit after each task or coherent test/implementation pair.
