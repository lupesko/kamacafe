# Phase 1 Data Model: Streamlined Roast Panel

This feature does not change `catalog.json`, recipe resolution, or any persisted
data contract. It adds one presentation-state concept around existing roast
selection and recommendation data.

## Roast Selection

Represents the existing visit-wide brewing recommendation choice.

| Field | Type | Rules |
|---|---|---|
| `level` | `light`, `medium`, or `dark` | Exactly one value is selected; Dark remains the fresh-load default. |
| `label` | `Light`, `Medium`, or `Dark` | All three labels are always visible and each renders on one line. |
| `recommendation` | Existing resolved roast recommendation | Must match the selected level and current drink’s underlying brewing method. |

**Ownership**: Existing application-level in-memory state.

**Lifecycle**: Persists through in-app drink navigation and browser history;
resets to Dark on a fresh application load. This feature does not modify that
lifecycle.

## Explanation Visibility

Represents whether the selected roast’s educational explanation is currently
shown on the active drink guide.

| Field | Type | Rules |
|---|---|---|
| `state` | `collapsed` or `expanded` | Starts collapsed for every newly opened or reloaded drink guide. |
| `summaryLabel` | `About this roast` | Always visible; communicates and toggles the current state. |
| `scope` | Current drink guide | Never persists to another drink guide, a reload, a URL, or browser storage. |

**Ownership**: Native disclosure state in the current roast panel. It is not a
catalog field, application-wide value, or persisted user preference.

### State transitions

| Current state | Event | Next state | Required side effects |
|---|---|---|---|
| Not mounted | Open or reload a drink guide | Collapsed | Selector and current roast remain visible; explanation is hidden. |
| Collapsed | Activate `About this roast` | Expanded | Reveal the complete explanation; retain focus and selected roast. |
| Expanded | Activate `About this roast` | Collapsed | Hide only the explanation; retain focus and selected roast. |
| Collapsed | Select another roast | Collapsed | Update recommendation facts and steps; prepare matching hidden explanation. |
| Expanded | Select another roast | Expanded | Update recommendation facts, steps, and visible explanation. |
| Either | Open a different drink guide | Collapsed | Preserve the existing visit-wide roast level; reset only explanation visibility. |
| Either | Reload the application | Collapsed | Existing application behavior also resets roast selection to Dark. |

## Roast Explanation

Represents the existing informational content associated with the selected
roast and resolved recipe.

| Field | Existing content | Visibility rule |
|---|---|---|
| Starting point | Selected roast heading | Hidden when collapsed; visible when expanded. |
| Flavor | Flavor characteristics | Hidden when collapsed; visible when expanded. |
| Extraction | Extraction guidance | Hidden when collapsed; visible when expanded. |
| Temperature | Temperature rationale | Hidden when collapsed; visible when expanded. |
| Grind | Grind rationale | Hidden when collapsed; visible when expanded. |

The content and relationship to recipe facts and preparation steps remain
unchanged. Visibility never affects recipe resolution or selection.

## Relationships and invariants

- One active drink guide has one Roast Selection and one Explanation Visibility
  state.
- One Roast Selection resolves one Roast Explanation for the current guide.
- Changing Roast Selection updates the explanation and recipe guidance but does
  not change Explanation Visibility.
- Changing Explanation Visibility never changes Roast Selection, facts, steps,
  serving multiplier, route, or catalog content.
- A newly mounted guide always initializes Explanation Visibility to collapsed,
  even when it inherits the visit-wide Roast Selection from the prior guide.
