# Phase 1 Data Model: Roast-Aware Brewing Recommendations

## Overview

`catalog.json` remains the authoritative content model. This feature extends
the existing `Recipe` and `ResolvedRecipe` models; it does not introduce a
database, remote service, browser persistence, or separate brewing-method
registry. A root recipe owns roast recommendations and a derived recipe
inherits them through the existing `baseRecipeId` lineage.

The approved existing recipe fields are the Medium baseline. Light and Dark
records contain explanations plus explicit overrides only for settings and
local method steps that change.

## Raw Catalog Entities

### RoastLevel

Canonical values, in display order:

1. `light`
2. `medium`
3. `dark`

No alias or additional value is accepted. Display labels are Light, Medium,
and Dark.

### TemperatureGuidance

`TemperatureGuidance = number | TemperatureRange`

| Shape | Fields | Rules |
|---|---|---|
| Single target | number | Inclusive 0–100; displayed as `{value}°C` |
| Target range | `{ min, max }` | Both bounds inclusive 0–100; `min <= max`; displayed as `{min}–{max}°C` |

Existing numeric recipe and ingredient temperatures remain valid. The range
shape is required for Dark espresso's 90–91°C target. Temperature values are
not scaled with servings.

### RoastAdjustment

| Field | Type | Rules |
|---|---|---|
| `grind` | `GrindGuidance`, optional | Complete qualitative label and positive ordered µm range when changed |
| `waterTemperatureC` | `TemperatureGuidance`, optional | Brewing-water target only; never milk or dilution water |
| `steps` | string[], optional | Complete ordered replacement for the owning root recipe's local steps; non-empty, nonblank entries |

At least one field is present when `adjustments` exists. Adjustments never
contain ingredients, quantities, ratios, yield, caffeine, serving size, milk,
ice, chocolate, or dilution settings.

### RoastRecommendation

| Field | Type | Rules |
|---|---|---|
| `flavor` | string | Required, nonblank, beginner-facing expected flavor description |
| `extraction` | string | Required, nonblank explanation of the roast's extraction behavior for this method |
| `temperatureExplanation` | string | Required, nonblank reason the target changes or stays fixed |
| `grindExplanation` | string | Required, nonblank reason the grind changes or stays fixed |
| `adjustments` | `RoastAdjustment`, optional | Allowed for Light/Dark; prohibited for Medium |

An explanation describes the initial recommendation only. It does not add
troubleshooting or follow-up guidance for an unsatisfactory cup.

### RoastRecommendations

An object with exactly three required keys:

| Field | Type | Rules |
|---|---|---|
| `light` | `RoastRecommendation` | Complete explanation; method-appropriate adjustments |
| `medium` | `RoastRecommendation` | Complete explanation; no adjustments; resolves to approved baseline |
| `dark` | `RoastRecommendation` | Complete explanation; method-appropriate adjustments |

Additional keys and partial maps are rejected.

### Recipe extension

The existing `Recipe` gains:

| Field | Type | Rules |
|---|---|---|
| `roastRecommendations` | `RoastRecommendations`, optional by shape | Required on every root recipe with no `baseRecipeId`; prohibited on derived recipes in this feature |

All existing recipe fields and rules remain. For root recipes,
`grind`, `waterTemperatureC`, and `steps` continue to define Medium. Derived
recipes continue to own their local ingredients and assembly steps.

## Method Recommendation Matrix

The seed content resolves to these structured targets:

| Root method | Light | Medium baseline | Dark |
|---|---|---|---|
| Espresso | 94°C; fine; ~150–400 µm | 93°C; fine; ~200–500 µm | 90–91°C; slightly coarser fine; ~300–600 µm |
| Pour-over | 96°C; fine-to-medium-fine; ~400–700 µm | 94°C; medium-fine; ~500–800 µm | 90°C; medium; ~700–1000 µm |
| French press | 96°C; medium-coarse; ~800–1100 µm | 94°C; coarse; ~1000–1400 µm | 90°C; coarse-to-very-coarse; ~1200–1600 µm |
| Turkish coffee | 20°C starting water; extra-fine; ~50–200 µm | Same settings | Same settings |

Turkish Light and Dark still provide different explanation and controlled-
heating step content even though temperature and grind remain method-fixed.

## Relationships and Ownership

```text
Root Drink Recipe (one underlying method)
└── RoastRecommendations (exactly one map)
    ├── light  → explanation + optional adjustments
    ├── medium → explanation + baseline recipe fields
    └── dark   → explanation + optional adjustments

Derived Drink Recipe
└── baseRecipeId → inherits the root map and selected method settings/steps
                  + appends local ingredients and assembly steps
```

Current root owners are Espresso, Pour-over, French press, and Turkish coffee.
Latte, Cappuccino, Americano, Macchiato, Mocha, Flat white, and Iced latte
inherit Espresso recommendations.

## Derived Models

### ResolvedRoastRecommendation

The selected, non-persisted explanation exposed to the drink UI:

| Field | Type | Source |
|---|---|---|
| `level` | `RoastLevel` | Current visit-wide selection |
| `flavor` | string | Selected root recommendation |
| `extraction` | string | Selected root recommendation |
| `temperatureExplanation` | string | Selected root recommendation |
| `grindExplanation` | string | Selected root recommendation |

The resolved grind, temperature, and steps stay on `ResolvedRecipe` so the
existing recipe panels and scaler remain the single rendering path.

### ResolvedRecipe extension

`ResolvedRecipe` retains all existing fields and adds:

| Field | Type | Rules |
|---|---|---|
| `roastRecommendation` | `ResolvedRoastRecommendation` | Required after publication resolution |

Resolution for `(drinkId, roastLevel)` proceeds as follows:

1. Walk `baseRecipeId` ancestors with the existing cycle and unknown-ID checks.
2. Locate the single root `RoastRecommendations` owner and select the requested level.
3. Start from the root recipe's Medium grind, water temperature, and local steps.
4. Apply the selected Light/Dark adjustment fields when present.
5. Append unchanged descendant ingredients and local assembly steps in lineage order.
6. Apply nearest-value inheritance for existing non-roast fields exactly as today.
7. If `brewRatio.target.kind` is `ingredient`, copy the selected brewing-water temperature into only that named ingredient.
8. Attach `ResolvedRoastRecommendation`; return new objects without mutating catalog input.

The resolver's omitted/default roast argument is `medium`, preserving existing
pure-function callers and baseline unit fixtures.

### ScaledRecipe interaction

Scaling consumes a roast-resolved recipe:

```text
raw recipe lineage → selected roast resolution → serving scaling → display
```

Ingredient quantities, espresso yield, water guidance, and g/mL mentions in
the selected steps scale exactly as today. Roast, explanations, temperature,
grind, ratio, caffeine per serving, and `scaleWithRecipe: false` equipment do
not scale. Changing roast does not reset the multiplier because multiplier
state remains owned by the keyed `DrinkView`.

### VisitRoastState

| Field | Type | Initial value | Lifetime |
|---|---|---|---|
| `roastLevel` | `RoastLevel` | `dark` | Current mounted application only |

State transitions:

| Event | Result |
|---|---|
| Fresh document load or reload | `dark` |
| Select Light, Medium, or Dark | Replace state with selected level |
| Navigate by in-app link | Preserve state |
| Browser Back or Forward | Preserve state |
| Open a shared address in a fresh document | `dark` |
| Change serving multiplier | Preserve roast state |

No value is written to URL, cookie, `localStorage`, `sessionStorage`, or a
server. Existing saved preferences, if any are introduced elsewhere, are not
read, erased, or reinterpreted by this feature.

## Validation Rules

### Shape validation

1. Retain all current catalog, category, drink, recipe, ingredient, caffeine,
   ratio, stable-ID, and image rules.
2. Accept single or ordered-range temperature guidance only within 0–100°C.
3. Require exact `light`, `medium`, and `dark` keys and reject extras.
4. Require all four nonblank explanation fields on every recommendation.
5. Validate optional adjustments and nonempty local step arrays.

### Semantic validation

1. Every root recipe owns one complete map; every derived recipe omits one.
2. Medium has no adjustment and resolves exactly to current base grind,
   temperature, and steps.
3. Resolve every published drink for all three roast levels without an error.
4. Every resolved variant has complete coffee, water/yield, temperature, grind,
   explanations, and ordered steps.
5. A selected water target and the explicit brew-ratio water ingredient have
   structurally equal temperature guidance.
6. Milk, dilution-water, chocolate, ice, quantities, ratios, yields, serving
   metadata, and caffeine remain equal across variants.
7. Any changed temperature shown in a fact has the same formatted target in
   the selected local method steps. Changed grind instructions use the selected
   qualitative label; no prior-roast numeric target remains.
8. Turkish resolves to 20°C and ~50–200 µm for all three levels while its
   explanations and controlled-heating content vary.
9. Catalog input remains unchanged after resolution.

## Publication Sequence

1. Validate the catalog and registry against their JSON Schemas.
2. Run existing ID, reference, range, unit, caffeine, image, and recipe-cycle checks.
3. Enforce roast ownership and Medium-baseline rules.
4. Resolve every drink at Light, Medium, and Dark.
5. Enforce complete guidance and cross-field synchronization on every resolved variant.
6. Reject publication on any error; render no runtime fallback to another method or roast.
