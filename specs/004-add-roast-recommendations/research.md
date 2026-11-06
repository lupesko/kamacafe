# Phase 0 Research: Roast-Aware Brewing Recommendations

## Existing stack and dependency policy

**Decision**: Implement the feature with the repository's current Node.js 24,
strict TypeScript 5.9, Preact 10.27, Vite 8, plain CSS, Ajv, Vitest,
Playwright/axe, and Lighthouse toolchain. Add no dependency.

**Rationale**: Inspection confirmed that Preact is the only production
dependency and that the requested behavior is local catalog transformation and
controlled UI state. The current framework already supplies state, rendering,
semantic HTML, and build-time JSON import. Baseline verification passed all 89
Vitest tests and strict type checking before design work.

**Alternatives considered**: A state library, form library, component library,
or templating package would duplicate native Preact/HTML behavior. A runtime
rules service would violate the static-app constraint and add failure states.

## Visit-wide state lifecycle

**Decision**: Own one `RoastLevel` value in `App`, initialize it to `dark`, and
pass it as controlled state to drink views and the selector.

**Rationale**: `App` remains mounted while the existing hash route changes, so
its state naturally survives drink/category links and browser Back/Forward.
`DrinkView` is keyed by drink ID and remains the correct owner of the serving
multiplier. A real reload remounts `App`, exactly implementing the clarified
Dark reset without persistence code.

**Alternatives considered**: `DrinkView`-local state would reset on each drink.
Context would add indirection for a short prop path. `localStorage` or
`sessionStorage` would conflict with fresh-load reset. Adding roast to the hash
would change the established sharing contract.

## Brewing-method identity and content ownership

**Decision**: Treat root recipes as underlying brewing methods. Add one complete
Light/Medium/Dark recommendation map to Espresso, Pour-over, French press, and
Turkish coffee; derived espresso drinks inherit the selected map through their
existing `baseRecipeId` lineage.

**Rationale**: Recipe inheritance already expresses the exact method sharing
the feature needs. The seven espresso-derived drinks receive one maintained
espresso recommendation while retaining local milk, chocolate, ice, dilution,
and assembly content. Root ownership keeps catalog editing obvious and prevents
duplicate advice.

**Alternatives considered**: A separate method registry would repeat the
lineage graph. Per-drink recommendation maps would duplicate espresso content
eight times. Hard-coded method checks in UI code would undermine the catalog as
the content source of truth.

## Medium compatibility and variant shape

**Decision**: Keep each root recipe's existing grind, water temperature, and
steps as the authoritative Medium baseline. Each recommendation record requires
flavor, extraction, temperature, and grind explanations; Light and Dark add an
`adjustments` object for changed grind, brew-water temperature, and full local
method steps. Medium adjustments are prohibited.

**Rationale**: This design preserves approved Medium values and wording exactly
without duplicating them. It also makes every Light/Dark difference explicit
and reviewable. The catalog is small—four root methods—so bounded variant steps
are simpler than introducing a general prose language.

**Alternatives considered**: Repeating complete settings and steps for all
three roasts would let Medium drift. Moving baseline settings entirely into
the recommendation map would force a broader model migration. A global roast
profile would not express method-specific settings and explanations.

## Resolution, step consistency, and scaling order

**Decision**: Extend the pure recipe resolver with a roast argument that
defaults to Medium. Apply the root adjustment while resolving lineage, append
unchanged child steps, synchronize the explicit brew-ratio water ingredient,
and only then pass the result through the existing serving scaler.

**Rationale**: Selecting local method steps before ancestor/child composition
lets latte and other derived guides receive adjusted espresso steps while
preserving their assembly steps. Synchronizing the water ingredient by the
existing `brewRatio.target` reference avoids name heuristics and leaves milk or
dilution temperatures untouched. Scaling afterward continues to transform g
and mL values in whichever step variant was selected while temperature, grind,
ratio, and caffeine remain fixed.

**Alternatives considered**: Search-and-replace of Medium temperature or grind
phrases is fragile and could modify milk/dilution values. Semantic prose tokens
would reduce repeated Light/Dark steps but introduce an editorial mini-language
and cannot preserve the existing Espresso phrase “grind ... finely” exactly
without additional token variants. Applying roast after scaling complicates
step synchronization and transformation tests.

## Temperature range representation

**Decision**: Generalize temperature guidance from a single number to a number
or ordered `{ min, max }` range and use one formatter/comparison rule for recipe
and ingredient temperatures.

**Rationale**: Dark espresso requires an honest 90–91°C target. Encoding it as
data keeps facts, steps, validation, and tests consistent and follows the
constitution's preference for a usable range over false precision. Existing
numeric temperatures remain valid unchanged.

**Alternatives considered**: Choosing only 90°C or 91°C would narrow the
accepted requirement. Putting “90–91°C” only in prose would make the structured
fact disagree with the explanation. A second range-only field would create
mutually exclusive temperature properties and more validation branches.

## Selector and explanation presentation

**Decision**: Add one focused controlled component using a native fieldset,
legend, and three labelled radio inputs, followed by the selected roast's four
explanation dimensions. Place it inside the existing “What you need” recipe
panel and continue rendering adjusted facts and steps through `RecipePanels`.

**Rationale**: Native radios supply checked-state semantics, arrow-key behavior,
touch operation, and assistive-technology labeling without custom ARIA logic.
Reusing Cocoa tokens, recipe-panel surfaces, focus styles, and responsive grid
patterns keeps the feature visually consistent and small.

**Alternatives considered**: Custom segmented buttons require manual radio
semantics and keyboard handling. A select menu hides the three beginner choices
and their current state. Putting the control in the hero would compete with
core recipe identification; a modal would interrupt brewing.

## Contract and publication validation

**Decision**: Publish a successor full catalog schema in this feature's
`contracts/` directory and update the implementation validator to import it.
Retain every current rule and add exact roast keys, explanation/adjustment
shape, range bounds, root ownership, derived inheritance, Medium compatibility,
all-roast resolution, and brew-water synchronization checks.

**Rationale**: The baseline schema is a historical contract. Versioning the
successor with the feature keeps past design evidence intact while providing
one machine-readable contract for implementation. Schema validation covers
shape; existing semantic TypeScript validation remains the right place for
lineage and cross-field rules.

**Alternatives considered**: Mutating the baseline contract would obscure what
the baseline originally promised. A schema fragment would not be directly
compilable by the current validator. Runtime-only validation would allow broken
content to reach the build.

## Verification strategy

**Decision**: Extend pure Vitest coverage for data/resolution/scaling and add a
dedicated Playwright roast suite while reusing the current Chromium/WebKit,
axe, responsive, media-failure, and Lighthouse infrastructure.

**Rationale**: There is no component-test dependency today. Pure logic belongs
in the existing unit seams; browser tests are necessary for native radio
keyboard behavior, visit navigation, reload reset, focus, layout, and rendered
facts/steps. Existing baseline-value browser tests can select Medium explicitly,
while dedicated tests prove Dark is the new default.

**Alternatives considered**: Adding a DOM component-test library would overlap
Playwright and increase dependencies. Snapshot tests would be weak evidence for
cross-field values and accessibility. Manual-only testing would miss the
high-risk inheritance and synchronization regressions required by the
constitution.
