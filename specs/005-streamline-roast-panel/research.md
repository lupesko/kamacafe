# Phase 0 Research: Streamlined Roast Panel

## Existing stack and dependency policy

**Decision**: Implement the feature with the repository’s current Node.js 24,
strict TypeScript 5.9, Preact 10.27, Vite 8, semantic HTML, and plain CSS. Add no
runtime or test dependency.

**Rationale**: The requested behavior is confined to one existing Preact
component and its layout. Native HTML already supplies disclosure state and
keyboard semantics, while Playwright/axe exercises the behavior in the actual
supported browsers.

**Alternatives considered**: A disclosure component package, state library, or
component-test DOM environment would duplicate platform and existing browser
test capabilities for a small UI change.

## Disclosure interaction pattern

**Decision**: Wrap only the existing roast explanation in a native closed
`details` element with a `summary` labeled `About this roast`. Keep the radio
fieldset outside it and retain polite live updates on the explanation content.

**Rationale**: Native details/summary exposes expanded and collapsed state,
supports mouse, touch, Enter, and Space, keeps focus on the summary, and removes
closed descendants from visual and accessibility presentation. It satisfies the
contract without manual IDs, ARIA synchronization, key handlers, or a second
source of state.

**Alternatives considered**: A controlled button with `aria-expanded`,
`aria-controls`, and a hidden panel is valid but adds state and synchronization.
A checkbox-based CSS disclosure has the wrong semantics. Hiding the entire
fieldset would violate the always-visible selector requirement.

## Disclosure state ownership and reset

**Decision**: Leave disclosure visibility browser-managed and uncontrolled.
Rely on the existing `DrinkView key={drink.id}` lifecycle to reset it for each
new guide or reload.

**Rationale**: Roast changes update props on the same component, so the native
open state remains unchanged while recommendation text rerenders. A different
drink ID remounts the subtree and naturally restores the absent `open` default.
This is exactly the required lifecycle and remains independent from visit-wide
roast state in `App`.

**Alternatives considered**: Lifting visibility into `App` would incorrectly
carry it across guides. Storing it in the URL or browser storage would change
navigation or reload contracts. Local component state is a fallback only if
cross-browser tests reveal native state is not preserved during reconciliation.

## Responsive option layout and label integrity

**Decision**: Keep the option group as a grid but use auto-fitting,
content-safe minimum tracks. Prevent option text from wrapping and allow whole
options to flow onto additional rows as the panel narrows.

**Rationale**: The current fixed three equal tracks combine with
`overflow-wrap: anywhere`, allowing `Medium` to split in a narrow recipe column
even when the viewport is wide. A panel-width-responsive grid gives the longest
label enough room, preserves readable type and 44 px targets, and avoids page
overflow at narrow widths and enlarged text.

**Alternatives considered**: Shrinking text reduces readability and remains
fragile. `white-space: nowrap` alone can overflow a narrow option. A
viewport-only breakpoint cannot account for the half-width panel created by
the desktop recipe layout. A select menu would hide the choices and change the
interaction contract.

## Summary and explanation styling

**Decision**: Style the native summary with existing Cocoa tokens as a
full-width minimum-44-pixel control and retain its native state-aware marker.
Use no fixed height or open/close animation.

**Rationale**: Existing global focus styling and native marker behavior already
communicate interactivity and state. Avoiding animation keeps the change small,
works with reduced-motion preferences, and prevents height measurement or
content-clipping defects.

**Alternatives considered**: A custom chevron requires additional state-aware
CSS and accessible-name review. Height animation complicates dynamic roast copy
and offers no required user value.

## Test layer and regression scope

**Decision**: Cover the feature primarily in the existing Playwright suites,
with full type, unit, build, and Lighthouse regression runs.

**Rationale**: The behavior depends on native DOM semantics, keyboard focus,
accessibility exposure, rendered text lines, available panel width, and height.
The repository has no component DOM test layer, while Playwright already runs
Mobile Safari, Mobile Chrome, Desktop Chrome, and Desktop WebKit and includes
axe and responsive geometry checks.

**Alternatives considered**: New component-test tooling adds a dependency and
cannot replace cross-browser layout checks. Visual snapshots add brittle image
baselines; direct semantic and geometry assertions target the actual defects.
Checking only computed `white-space` does not prove that labels are contained or
rendered on one line.

## Measurable validation approach

**Decision**: Reuse the existing 320, 390, 430, 680, and 1440 px matrix. Count
rendered text fragments for each option label, verify label/control bounds,
measure collapsed and expanded panel heights, and run axe in both states.

**Rationale**: The matrix covers narrow phones, the 680 px transition into the
two-column recipe layout, and full desktop. A one-fragment label assertion
proves the user-visible no-wrap outcome; `closedHeight <= expandedHeight × 0.60`
directly proves the specified 40% reduction.

**Alternatives considered**: A separate all-drinks layout suite would duplicate
cost. Default-closed coverage can be folded into the existing catalog matrix,
while the responsive suite can use one representative long-label guide.
