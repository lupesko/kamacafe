# Implementation Plan: Streamlined Roast Panel

**Branch**: `005-streamline-roast-panel` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-streamline-roast-panel/spec.md`

## Summary

Refine the existing roast selector without changing roast data or recommendation
logic. Rename its native radio-group legend to “Pick your roast,” keep all three
choices outside a disclosure so they remain visible, and place only the existing
explanation inside a native closed-by-default details/summary control. Preserve
the browser-owned disclosure state through roast rerenders and let the existing
keyed drink view reset it when a different guide opens. Replace wrapping-prone
equal tracks with panel-width-responsive option tracks and nonbreaking labels so
“Medium” stays on one line without clipping or page overflow. Use the current
Preact, TypeScript, plain CSS, Playwright/axe, and Lighthouse stack with no new
dependency or data migration.

## Technical Context

**Language/Version**: TypeScript 5.9 in strict mode on Node.js 24.x; Preact JSX;
semantic HTML; modern CSS

**Primary Dependencies**: Preact 10.27, Vite 8, `@preact/preset-vite`; no new
runtime, UI, state-management, accessibility, styling, or test dependency

**Storage**: N/A for persisted storage; existing visit-wide roast state remains
in memory, while disclosure visibility is local browser-managed interface state

**Testing**: TypeScript type checking; Vitest 4 regression suite; Playwright
1.55 across mobile and desktop Chromium/WebKit; `@axe-core/playwright` for
accessibility; Lighthouse CI for mobile performance and asset budgets

**Target Platform**: Responsive static single-page web app delivered through
Cloudflare Workers Static Assets; current Android Chrome, iOS Safari, desktop
Chrome, and desktop Safari represented by the existing Playwright projects

**Project Type**: Client-only static web application

**Performance Goals**: Preserve the existing Lighthouse minimums and asset
budgets, including accessibility ≥0.95, first contentful paint ≤3 seconds,
total blocking time ≤300 ms, script ≤100 KiB, and stylesheet ≤50 KiB; disclosure
and roast selection remain local interactions with no network request

**Constraints**: Exact heading “Pick your roast”; Light, Medium, and Dark always
visible; explanation closed on every newly opened or reloaded guide; disclosure
state unchanged by roast selection; no label wrapping, clipping, overlap, or
horizontal page scrolling from 320–1440 px and with enlarged text; at least
44×44 px interactive targets; touch, keyboard, and assistive-technology support;
no new route, storage, catalog field, request-time compute, or dependency

**Scale/Scope**: One existing component and its CSS; 11 current drink guides;
three roast choices; one disclosure containing five existing explanation
elements; focused updates to three Playwright suites plus full regression and
performance checks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Design evidence | Status |
|---|---|---|
| Useful Brewing Guidance | The selector, selected roast, facts, steps, and complete existing explanation remain available. Only the explanation’s initial visibility changes. | PASS |
| Simplicity, Beauty, and Speed | Use native disclosure semantics, the existing component, plain CSS, and browser state. Add no dependency, service, route, storage, or data model. | PASS |
| Mobile Usability | Choices remain visible, labels stay intact, option layout responds to panel width, controls retain 44 px targets, and Playwright/axe covers 320–1440 px plus keyboard/touch behavior. | PASS |
| Open Collaboration | The UI behavior is documented in a public contract and validated by repository tests and a reproducible quickstart. | PASS |
| Maintainable Changes | Preserve existing roast logic and test it through the established browser suites; avoid a second state owner or custom disclosure implementation. | PASS |
| Static Hosting | All behavior remains local semantic HTML/CSS within the existing static application. | PASS |
| Secrets | The feature adds no credential, private data, analytics, persistence, or external integration. | PASS |

**Post-design re-check**: PASS. Phase 1 retains one static frontend, makes no
catalog or API change, and uses a native disclosure plus content-safe responsive
tracks. The UI contract and targeted browser coverage are proportionate to the
behavioral risk. No constitutional exception or complexity justification is
required.

## Project Structure

### Documentation (this feature)

```text
specs/005-streamline-roast-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── roast-panel-ui-contract.md
└── tasks.md                         # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app.tsx                          # Existing visit-wide roast state; unchanged
├── views/
│   └── drink-view.tsx               # Existing key={drink.id} reset boundary; unchanged
├── components/
│   └── roast-selector.tsx           # Rename legend; add native explanation disclosure
└── styles/
    └── app.css                      # Responsive single-line options and disclosure styles

tests/
└── e2e/
    ├── roast-recommendations.spec.ts       # Disclosure lifecycle and roast synchronization
    ├── responsive-accessibility.spec.ts    # Single-line geometry, height, keyboard, axe
    └── media-failure.spec.ts               # Disclosure remains usable without images
```

**Structure Decision**: Preserve the current single-project layout. The change
belongs entirely in `RoastSelector` and its styles. `App` continues to own only
visit-wide roast selection, and the existing `DrinkView` key remains the reset
boundary for per-guide interface state. No unit-test-only component environment
or new source layer is warranted; browser behavior is covered through the
established end-to-end suites.

## Implementation Design

### Semantic disclosure and state lifecycle

- Keep the current `<fieldset>` and native Light/Medium/Dark radio inputs as the
  always-visible primary interaction.
- Change the fieldset legend to the exact text `Pick your roast`.
- Place only the current `.roast-explanation` content inside a native `<details>`
  element whose `<summary>` reads `About this roast`.
- Omit the `open` attribute initially. Native semantics provide touch, Enter,
  Space, expanded/collapsed state, focus retention, and removal of closed
  descendants from visual and accessibility presentation.
- Retain `aria-live="polite"` on the explanation content so an expanded panel
  communicates roast-dependent copy changes without announcing hidden details.
- Do not add Preact disclosure state. Roast prop changes patch the same element
  and leave its browser-owned open state intact. Opening a different drink
  remounts `DrinkView` through the existing `key={drink.id}`, restoring the
  disclosure to its default closed state. Reloading also remounts it.
- If browser testing shows reconciliation does not preserve the native open
  property, the bounded fallback is local `useState(false)` in `RoastSelector`;
  state must not move into `App` or persist across guides.

### Responsive label and panel layout

- Keep the current grid, radio inputs, selected styling, focus outline, and
  minimum 44 px option height.
- Replace fixed three equal columns with auto-fitting tracks that have a
  content-safe minimum. The whole option may move to another row as the panel
  narrows, but its label may not split.
- Apply nonbreaking label text and remove wrapping behavior that currently
  permits `Medium` to split. Do not solve the issue by shrinking text.
- Let the layout respond to available panel width, including the narrow half of
  the two-column recipe layout, instead of relying only on viewport width.
- Style the native summary as a full-width, minimum 44 px control using existing
  Cocoa color, typography, border, cursor, and global focus tokens. Keep a
  state-aware native disclosure marker rather than introducing a custom icon.
- Avoid fixed heights and animation. Expanded explanation copy continues to
  wrap normally, and reduced-motion behavior remains unchanged.

### Compatibility boundaries

- Do not alter roast recommendation data, recipe resolution, serving scaling,
  route grammar, current Dark fresh-load default, or visit-wide roast choice.
- Keep radio names, values, labels, order, checked semantics, and change callback
  unchanged so existing selection tests and assistive behavior remain valid.
- Preserve all explanation headings and copy. The feature changes only its
  visibility container and adds the summary label.
- Update existing tests that expect visible explanation content to expand the
  disclosure first; fact and preparation-step assertions remain valid while it
  is closed.

### Validation strategy

- Add focused Playwright scenarios for the exact legend, default closed state,
  one-action toggle, focus retention, selector visibility, roast changes while
  closed and open, and reset on new guide/reload.
- Fold the default-closed assertion into the existing catalog-wide drink matrix
  so all published guides are covered without a duplicate navigation suite.
- At the existing 320, 390, 430, 680, and 1440 px widths, measure each rendered
  option label as one text line, verify containment and no page overflow, and
  assert collapsed height is no more than 60% of expanded height.
- Run axe in both closed and expanded states and include the summary in keyboard,
  focus, and 44×44 px target checks.
- Expand the disclosure before explanation assertions in the optional-image
  failure scenario, while retaining all recipe facts and step checks.
- Retain the full type, unit, build, browser, and Lighthouse suites. No new
  Vitest file is needed because the behavior depends on real DOM semantics and
  responsive layout rather than domain logic.
