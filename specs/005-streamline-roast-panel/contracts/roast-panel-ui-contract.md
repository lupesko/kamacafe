# Roast Panel UI Contract

This contract defines the user-visible and accessibility behavior of the roast
panel on every published drink guide. It introduces no public API, route,
catalog, or persistence contract.

## Always-visible selection contract

- The radio-group legend is exactly `Pick your roast`.
- The group exposes exactly three native radio choices in this order: Light,
  Medium, Dark.
- The current checked state remains visible and programmatically available.
- The group and all choices remain visible whether details are collapsed or
  expanded.
- Radio names, values, checked behavior, arrow-key behavior, and roast change
  callbacks retain their existing contract.
- Each label renders as one line. A whole option may move to another row when
  panel width is constrained; a label may not split, clip, overlap, or create
  horizontal page scrolling.

## Explanation disclosure contract

- Only the existing explanation is placed inside a disclosure. The legend and
  radio group remain outside it.
- The disclosure control is labeled exactly `About this roast`.
- Every newly opened or reloaded drink guide starts with the disclosure closed.
- One mouse, touch, Enter, or Space activation toggles the disclosure.
- The control exposes its expanded or collapsed state through native semantics,
  retains focus after toggling, and has a visible focus indicator.
- Closed explanation content is not presented as visible content to assistive
  technology.
- Expanded content includes the selected roast’s starting-point heading plus
  Flavor, Extraction, Temperature, and Grind entries.
- Expanded content retains polite update behavior when the selected roast
  changes.

## State contract

- Changing roast while closed leaves the disclosure closed and updates facts,
  preparation steps, and the hidden explanation to the new roast.
- Changing roast while open leaves the disclosure open and updates the visible
  explanation, facts, and preparation steps together.
- Opening another drink preserves the existing visit-wide roast choice but
  resets its disclosure to closed.
- Reloading preserves the established fresh-load behavior: Dark is selected and
  the disclosure is closed.
- Toggling the disclosure never changes roast, serving multiplier, route, facts,
  steps, or recommendation data.

## Responsive and visual contract

- At 320, 390, 430, 680, and 1440 CSS pixels, every choice and the disclosure
  control is contained within the roast panel.
- Radio options and the disclosure control retain at least 44×44 CSS-pixel
  interactive targets.
- `Medium` and the other labels occupy exactly one rendered text line in selected
  and unselected states.
- The document has no horizontal overflow in closed or expanded states.
- At phone, tablet, and desktop reference widths, collapsed panel height is no
  more than 60% of expanded panel height.
- Expanded explanation text may wrap normally and remains readable without
  covering or displacing the selector.
- The design does not rely on hover, color alone, fixed heights, or motion.

## Regression contract

The following behavior remains unchanged:

- Dark fresh-load default and visit-wide roast persistence;
- roast-aware recipe facts and preparation steps;
- radio selection and keyboard arrow navigation;
- serving scaling and recipe quantities;
- drink/category addresses, direct links, Back/Forward, and unavailable pages;
- optional-image failure behavior;
- catalog content, recipe inheritance, social metadata, and static deployment;
- existing accessibility, performance, and asset-size budgets.
