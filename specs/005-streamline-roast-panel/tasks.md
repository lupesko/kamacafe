---

description: "Dependency-ordered implementation tasks for the streamlined roast panel"
---

# Tasks: Streamlined Roast Panel

**Input**: Design documents from `/specs/005-streamline-roast-panel/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/roast-panel-ui-contract.md](./contracts/roast-panel-ui-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Browser tests are included because the feature specification defines interaction, responsive, and accessibility acceptance criteria, and the project constitution requires automated regression coverage for behavior changes.

**Organization**: Tasks are grouped by user story so each increment can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches a different file and has no dependency on an incomplete task
- **[Story]**: Maps the task to a user story from `spec.md`
- Every task includes an exact repository-relative file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Use the existing locked toolchain without broadening project scope

- [X] T001 Use Node.js 24 from `.nvmrc` and install the existing locked dependencies from `package-lock.json` without adding or upgrading packages

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm that no shared infrastructure or data migration blocks story work

No foundational implementation is required. The existing `src/components/roast-selector.tsx`, `src/styles/app.css`, Playwright projects, catalog model, and keyed `DrinkView` lifecycle provide the complete foundation.

**Checkpoint**: Existing project foundation is ready; proceed directly to User Story 1.

---

## Phase 3: User Story 1 - Pick a Roast Without Label Wrapping (Priority: P1) 🎯 MVP

**Goal**: Display the exact heading `Pick your roast` and keep Light, Medium, and Dark visible with each label on one line across supported panel widths.

**Independent Test**: Open any published drink guide at 320, 390, 430, 680, and 1440 px; verify the exact group heading, all three visible options, one rendered line per label, contained text, unchanged selection behavior, and no horizontal page overflow.

### Tests for User Story 1

> Write these tests first and confirm the new assertions fail before implementation.

- [X] T002 [P] [US1] Add exact `Pick your roast` group-name and always-visible Light/Medium/Dark assertions to the catalog-wide scenarios in `tests/e2e/roast-recommendations.spec.ts`
- [X] T003 [P] [US1] Add rendered-line counting plus label-within-control and no-overflow assertions at 320, 390, 430, 680, and 1440 px in `tests/e2e/responsive-accessibility.spec.ts`

### Implementation for User Story 1

- [X] T004 [P] [US1] Change only the fieldset legend to exact text `Pick your roast` while preserving the existing native radio order, names, values, checked state, and callback in `src/components/roast-selector.tsx`
- [X] T005 [P] [US1] Replace wrapping-prone fixed option tracks with auto-fitting content-safe tracks and enforce single-line option text without clipping, overlap, font shrinking, or page overflow in `src/styles/app.css`

**Checkpoint**: User Story 1 is complete when its focused Playwright assertions pass independently and Medium remains intact at the screenshot layout and all supported widths.

---

## Phase 4: User Story 2 - Keep Explanations Compact Until Needed (Priority: P1)

**Goal**: Keep roast selection visible while the complete explanation starts collapsed, toggles in one interaction, preserves visibility state across roast changes, and resets closed for each new guide.

**Independent Test**: Open a guide and verify details are closed while the selector remains usable; toggle details open and closed; change roast in both states; navigate to another guide and reload; confirm explanation visibility follows the state contract and collapsed height is no more than 60% of expanded height.

### Tests for User Story 2

> Write these tests first and confirm the new assertions fail before implementation.

- [X] T006 [P] [US2] Add default-closed, one-action toggle, selector-always-visible, closed/open roast-change, new-guide reset, reload reset, and complete expanded-content scenarios—and update existing explanation assertions to open details first—in `tests/e2e/roast-recommendations.spec.ts`
- [X] T007 [P] [US2] Update the image-failure journey to assert that `About this roast` remains usable and to expand details before checking Flavor, Extraction, Temperature, and Grind in `tests/e2e/media-failure.spec.ts`
- [X] T008 [P] [US2] Add closed-versus-expanded height measurement (`closedHeight <= expandedHeight * 0.60`) and no-overflow checks for both disclosure states at representative phone, tablet, and desktop widths in `tests/e2e/responsive-accessibility.spec.ts`

### Implementation for User Story 2

- [X] T009 [P] [US2] Keep the roast fieldset outside a native closed-by-default `<details>`, add an exact `About this roast` `<summary>`, and place the unchanged starting-point heading and four explanation dimensions inside it in `src/components/roast-selector.tsx`
- [X] T010 [P] [US2] Style the native disclosure and expanded explanation spacing with existing Cocoa tokens, a full-width summary, no fixed height, and no open/close animation in `src/styles/app.css`

**Checkpoint**: User Story 2 is complete when the selector is always visible, explanation state follows every transition in `data-model.md`, and the compactness criterion passes independently.

---

## Phase 5: User Story 3 - Operate the Compact Panel Accessibly (Priority: P2)

**Goal**: Ensure touch, keyboard, and assistive-technology users can identify and operate the selector and disclosure without focus loss, hidden-content leakage, undersized targets, or color-only state.

**Independent Test**: Use keyboard input to focus and toggle `About this roast`, verify focus retention and native state, navigate the radio group with arrow keys, run axe with details closed and expanded, and confirm every interactive target is at least 44×44 px.

### Tests for User Story 3

> Extend the browser checks before accessibility remediation and confirm each new assertion exercises the intended state.

- [X] T011 [US3] Extend keyboard coverage with summary focus retention, Enter/Space toggling, native expanded/collapsed state, 44×44 px summary target, closed and expanded axe scans, and unchanged radio arrow-key behavior in `tests/e2e/responsive-accessibility.spec.ts`

### Implementation for User Story 3

- [X] T012 [US3] Audit and correct the native disclosure, polite live-update boundary, summary focus treatment, minimum touch target, and non-color selected state in `src/components/roast-selector.tsx` and `src/styles/app.css` until the User Story 3 checks pass without custom key handlers or redundant ARIA

**Checkpoint**: User Story 3 is complete when the closed and expanded panel passes keyboard, touch-target, and axe coverage across the configured browser projects.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Document the changed behavior and run the complete regression/release-readiness path

- [X] T013 [P] Update the roast-guidance overview to state that selection stays visible while `About this roast` starts collapsed in `README.md`
- [ ] T014 Execute every automated and manual scenario in `specs/005-streamline-roast-panel/quickstart.md`, including typecheck, unit tests, production build, focused and full Playwright projects, Lighthouse budgets, the screenshot-width check, 320 px with 200% text enlargement, and one screen-reader pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; starts immediately.
- **Foundational (Phase 2)**: No code work; confirms the existing foundation after Setup.
- **User Story 1 (Phase 3)**: Starts after Setup/Foundation and establishes the shared selector heading and responsive option layout.
- **User Story 2 (Phase 4)**: Starts after User Story 1 to avoid conflicts in the same component, stylesheet, and browser suites; its disclosure behavior remains independently testable.
- **User Story 3 (Phase 5)**: Starts after User Story 2 because it validates and hardens the disclosure introduced there.
- **Polish (Phase 6)**: Starts after all desired user stories are complete.

### User Story Dependency Graph

```text
Setup / existing foundation
          |
          v
US1: heading + intact labels (MVP)
          |
          v
US2: compact disclosure lifecycle
          |
          v
US3: accessible operation
          |
          v
Documentation + full validation
```

### Within Each User Story

- Add the story’s failing browser assertions before changing implementation.
- Implement semantic markup before relying on visual refinements.
- Keep data, recipe resolution, routes, and visit-wide roast state unchanged.
- Run the story’s independent test at its checkpoint before moving forward.

### Parallel Opportunities

- **US1**: T002 and T003 can run in parallel; after those tests are written, T004 and T005 can run in parallel because they touch different files.
- **US2**: T006, T007, and T008 can run in parallel; after those tests are written, T009 and T010 can run in parallel because they touch different files.
- **US3**: T011 precedes T012 because both define and remediate the same accessibility behavior; no safe within-story parallel split is needed.
- **Polish**: T013 can run in parallel with preparation for T014, but T014 records the final integrated outcome and therefore finishes last.

## Parallel Example: User Story 1

```text
Task T002: Add exact group-name and selector-visibility coverage in tests/e2e/roast-recommendations.spec.ts
Task T003: Add rendered-line and bounds coverage in tests/e2e/responsive-accessibility.spec.ts

Then in parallel:
Task T004: Update the exact legend in src/components/roast-selector.tsx
Task T005: Implement content-safe option layout in src/styles/app.css
```

## Parallel Example: User Story 2

```text
Task T006: Add disclosure lifecycle coverage in tests/e2e/roast-recommendations.spec.ts
Task T007: Update the image-failure flow in tests/e2e/media-failure.spec.ts
Task T008: Add height and two-state overflow coverage in tests/e2e/responsive-accessibility.spec.ts

Then in parallel:
Task T009: Implement the native disclosure in src/components/roast-selector.tsx
Task T010: Style disclosure states in src/styles/app.css
```

## Parallel Example: User Story 3

```text
Task T011: Define keyboard, focus, native-state, target-size, and axe expectations in tests/e2e/responsive-accessibility.spec.ts
Task T012: Apply only the semantic or styling corrections needed in src/components/roast-selector.tsx and src/styles/app.css
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete T001 and confirm the existing foundation.
2. Complete T002–T005.
3. Run the User Story 1 independent browser check.
4. Stop here for a deployable MVP that fixes the reported `Medium` wrapping and heading clarity without changing explanation behavior.

### Incremental Delivery

1. **US1**: Ship the exact heading and robust label layout.
2. **US2**: Add the closed-by-default explanation and state lifecycle.
3. **US3**: Complete accessibility hardening and cross-state axe coverage.
4. **Polish**: Update README and execute the complete quickstart validation.

Each increment preserves roast recommendation data, recipe facts, preparation
steps, serving scaling, routes, and visit-wide selection behavior.

## Notes

- `[P]` tasks touch different files and have no dependency on an incomplete task.
- `[US1]`, `[US2]`, and `[US3]` map directly to the prioritized stories in `spec.md`.
- Native details/summary is the planned default; add local Preact state only if cross-browser tests prove native open state is not preserved through roast rerenders.
- Do not add dependencies, custom keyboard handlers, redundant disclosure ARIA, catalog changes, new routes, or persistence.
- Commit after each task or coherent test/implementation pair and stop at any checkpoint for independent validation.
