# Roast Guidance Contract

## Scope

This contract extends every published drink guide with a roast choice and
method-aware recommendation while preserving the existing application address,
navigation, recipe, scaling, and media-failure contracts.

## Public addresses

No address changes are introduced.

| View | Address | Roast behavior |
|---|---|---|
| Home | `/` | No selector; current in-memory selection is preserved |
| Category | `/#category-{category.id}` | No selector; current in-memory selection is preserved |
| Drink | `/#{drink.id}` | Show selector and selected method recommendation |
| Unavailable | Unknown nonempty hash | Existing unavailable view; preserve in-memory selection |

A fresh document load at any address initializes Dark. Roast is never encoded
in the hash, query, canonical URL, or social metadata.

## Selection behavior

- Exactly three options appear in Light, Medium, Dark order.
- Dark is checked on a fresh load.
- Selecting an option updates explanation, grind, brewing-water temperature,
  brew-water ingredient temperature when applicable, and method steps together.
- The checked option remains active through in-app links and browser
  Back/Forward until a fresh load.
- Reloading or opening a shared address in a fresh document resets Dark.
- Roast changes do not reset the current serving multiplier.
- Navigating to a different drink keeps roast but preserves the existing rule
  that the new drink starts at one serving.
- No selection is written to browser storage or sent over the network.

## Selector semantics

- The selector is one native fieldset with a visible “Roast level” legend.
- Each option is a labelled native radio in one group.
- Checked state is programmatically determinable and visible without relying on
  color alone.
- Standard radio keyboard behavior works, including Tab entry and arrow-key
  movement within the group.
- Every label provides at least a 44 by 44 CSS-pixel activation area.
- Focus remains visible under the existing global focus convention.
- Controls and explanations wrap without document overflow from 320 through
  1440 CSS pixels and do not depend on hover.

## Explanation content

The selected recommendation displays all four required dimensions:

1. likely flavor characteristics;
2. method-specific extraction behavior;
3. the temperature target and why it changes or stays fixed;
4. the grind target and why it changes or stays fixed.

The copy presents a starting recommendation, not a guarantee. It does not add
troubleshooting or instructions for correcting an unsatisfactory cup.

## Recipe rendering

- `RecipePanels` receives one roast-resolved recipe and remains the single
  renderer for ingredients, grind, temperature, ratio, yield, water guidance,
  and ordered steps.
- A temperature range uses an en dash and one unit suffix, for example
  `90–91°C`.
- A grind continues to use the existing form, for example
  `fine · ~200–500 µm`.
- Any temperature or grind value embedded in selected method steps agrees with
  the recipe fact. No prior-roast value remains visible after selection.
- Medium renders the approved pre-feature facts and local method steps exactly.
- Light/Dark replace only declared roast-sensitive root-method values and local
  root steps.
- Derived espresso drinks append their unchanged local assembly steps after
  the selected espresso steps.
- Milk, milk temperature, dilution water, chocolate, ice, coffee/water amounts,
  ratio, yield, serving size, caffeine, and unrelated ingredients do not change.
- When a water-based recipe scales, quantities in the selected steps scale
  through the existing scaler while temperature and grind remain fixed.

## Method targets

| Method | Light | Medium | Dark |
|---|---|---|---|
| Espresso family | 94°C; fine; ~150–400 µm | 93°C; fine; ~200–500 µm | 90–91°C; slightly coarser fine; ~300–600 µm |
| Pour-over | 96°C; fine-to-medium-fine; ~400–700 µm | 94°C; medium-fine; ~500–800 µm | 90°C; medium; ~700–1000 µm |
| French press | 96°C; medium-coarse; ~800–1100 µm | 94°C; coarse; ~1000–1400 µm | 90°C; coarse-to-very-coarse; ~1200–1600 µm |
| Turkish coffee | 20°C; extra-fine; ~50–200 µm | 20°C; extra-fine; ~50–200 µm | 20°C; extra-fine; ~50–200 µm |

Turkish explanation and controlled-heating step wording still vary by roast.

## Catalog and resolution contract

- The machine-readable shape is [catalog.schema.json](./catalog.schema.json).
- Every root recipe owns exactly one complete Light/Medium/Dark map.
- Derived recipes inherit and do not define local maps.
- Medium has no adjustment object; existing root recipe fields are its values.
- Light/Dark adjustment step arrays replace only the root recipe's local steps.
- Resolution occurs before serving scaling and never mutates catalog input.
- The existing explicit brew-ratio target identifies the only water ingredient
  whose temperature follows the selected roast. Display names are not parsed.
- Every drink must resolve successfully at all three levels before publication.
- Missing levels, copy, settings, steps, invalid ranges, or contradictory water
  temperatures reject publication; there is no runtime fallback.

## Regression contract

The following existing behavior remains unchanged except where this contract
explicitly selects roast-dependent content:

- category/drink route grammar and shared links;
- direct visits, refresh, Back/Forward, and unavailable-page handling;
- recipe inheritance order and child assembly content;
- serving scaling and ratio presentation;
- contribution and repository links;
- optional-image failure behavior;
- social metadata and static deployment;
- accessibility and performance budgets.
