# Phase 1 Data Model: KamaCafe Baseline

## Overview

The committed catalog is the authoritative content model. The application
builds lookup indexes and resolved recipes in memory; it does not persist user
or application state. JSON shape rules live in
`contracts/catalog.schema.json`, while graph and publication rules are enforced
by the semantic validator.

## Entities

### Catalog

| Field | Type | Rules |
|---|---|---|
| `categories` | `Category[]` | Required, non-empty, source order is display order |
| `drinks` | `Drink[]` | Required, non-empty, source order is category display order after filtering |

Publication requires unique category IDs, unique drink IDs, valid references,
complete resolved recipes, and one matching image per drink.

### Category

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required; `^[a-z0-9]+(?:-[a-z0-9]+)*$`; unique among categories; registered and never reused |
| `name` | string | Required, non-blank US English display name |
| `description` | string | Required, non-blank short description |

Relationship: one category has zero or more drinks through `Drink.category`.
Only categories present in the published catalog appear on home.

### Drink

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required; same slug rule; unique among drinks; registered and never reused |
| `name` | string | Required, non-blank display name |
| `header` | string | Required one-line description |
| `category` | Category ID | Must resolve to exactly one category |
| `servingSizeMl` | positive number | Required; displayed with mL |
| `prepTimeMinutes` | positive number | Required; displayed in minutes |
| `difficulty` | Difficulty | Required |
| `caffeine` | CaffeineEstimate | Required |
| `recipe` | Recipe | Required; must resolve to complete brewing guidance |

Relationship: each drink belongs to one category and may inherit from at most
one other drink recipe. Each drink has one expected image at
`public/images/{id}.png`.

### Difficulty

| Field | Type | Rules |
|---|---|---|
| `level` | `Easy \| Moderate \| Advanced` | Required |
| `reason` | string | Required, non-blank brief explanation |

### CaffeineEstimate

| Field | Type | Rules |
|---|---|---|
| `minMg` | non-negative number | Required; not greater than `maxMg` |
| `maxMg` | non-negative number | Required; not less than `minMg` |
| `note` | string | Required assumption or variability explanation |
| `sourceUrls` | URL[] | Required, non-empty, HTTPS sources |

### Recipe

| Field | Type | Rules |
|---|---|---|
| `baseRecipeId` | Drink ID, optional | Must resolve; must not refer to self or form a cycle |
| `ingredients` | `Ingredient[]` | Required; local ingredients in display order |
| `grind` | string, optional | Required after inheritance resolution |
| `waterTemperatureC` | number, optional | Required after resolution; displayed with °C |
| `espressoYieldG` | positive number, optional | Alternative output target for espresso recipes; displayed with g |
| `waterGuidance` | string, optional | Required when water amount is represented by reservoir/yield guidance rather than an ingredient amount |
| `steps` | string[] | Required, non-empty, ordered, non-blank |

A resolved recipe must contain coffee amount, grind, water amount or espresso
yield guidance, water temperature, and ordered steps. A recipe that contains a
milk ingredient must provide its amount and `temperatureC`; recipes without a
milk ingredient omit milk fields.

### Ingredient

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required, non-blank |
| `quantity` | positive number or QuantityRange | Required; range may start at zero for an optional ingredient |
| `unit` | `g \| mL \| filter` | Required; mass uses g and liquid uses mL |
| `temperatureC` | number, optional | Required for milk and for ingredients whose usable temperature matters |
| `optional` | boolean, optional | Defaults to false |
| `note` | string, optional | Assumption or usage guidance; non-blank when present |

### QuantityRange

| Field | Type | Rules |
|---|---|---|
| `min` | non-negative number | Required; less than or equal to `max` |
| `max` | positive number | Required; greater than or equal to `min` |

### CatalogIdRecord

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required slug; unique within `kind`; immutable |
| `kind` | `category \| drink` | Required; immutable |
| `introducedAs` | string | Required audit label; does not constrain later display-name changes |
| `status` | `active \| retired` | Required; retirement is one-way |

All current catalog IDs must have active records. An ID removed from the catalog
is changed to retired and retained permanently. Adding a new ID requires an
explicit registry addition reviewed as a new identity. A retired record cannot
return to active.

## Derived Models

### ResolvedRecipe

The resolver performs a depth-first walk from the selected drink through its
ancestors and returns:

- `lineage`: ancestor drink IDs followed by the selected drink ID.
- `ingredients`: ancestor arrays followed by local arrays, preserving order.
- `steps`: ancestor arrays followed by local arrays, preserving wording and
  renumbered continuously for display.
- `grind`, `waterTemperatureC`, `espressoYieldG`, and `waterGuidance`: the
  nearest value defined while walking from local recipe toward ancestors.

Resolution fails on an unknown base ID or repeated ID. Publication fails if the
resolved result does not meet complete-guidance rules.

### AppRoute

| State | Hash form | Resolution |
|---|---|---|
| Home | empty string or `#` | Home view |
| Category | `#category-{category-id}` | Matching category or unavailable |
| Drink | `#{drink-id}` | Matching drink or unavailable |
| Unavailable | any non-matching hash | Message preserving no catalog state; home link |

Navigation is URL state. A `hashchange` recomputes the route and scrolls the new
view to the top. Browser history remains owned by the browser.

## Validation Sequence

1. Validate `catalog.json` and the ID registry against their JSON Schemas.
2. Build category and drink indexes and reject duplicate IDs.
3. Check every category, base recipe, and registry reference.
4. Detect recipe cycles with depth-first traversal.
5. Resolve every published drink and enforce complete guidance, ranges, units,
   milk rules, and caffeine ordering.
6. Confirm every drink has `public/images/{id}.png` and reject orphaned drink
   images unless explicitly documented.
7. Check current IDs are active and retired IDs are absent from the catalog.

There are no mutable runtime entity states beyond route changes. Catalog ID
status changes only from newly registered active to retired.
