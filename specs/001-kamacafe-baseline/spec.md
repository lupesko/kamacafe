# Feature Specification: KamaCafe Baseline

**Feature Branch**: main (no feature branch created)

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "create baseline spec for kamacafe"; informed by the agreed product scope and constitution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a Method and Brew (Priority: P1)

As a coffee enthusiast, I can choose a coffee category, browse its drinks, choose
one, and follow complete instructions for making it.

**Why this priority**: A usable brewing guide is the core value of KamaCafe.

**Independent Test**: A visitor can choose a category and any drink in it, then
prepare it using only the displayed ingredients, settings, and ordered steps.

**Acceptance Scenarios**:

1. **Given** a visitor opens KamaCafe, **When** they view the home page, **Then**
   they see a choice for every published catalog category.
2. **Given** a visitor selects a category, **When** its page opens, **Then** they
   see every drink in that category, in catalog order, with a name, estimated
   preparation time, difficulty, and a way to open its guide.
3. **Given** a visitor selects a drink, **When** its guide opens,
   **Then** they see the ingredient amounts, grind size, water temperature, milk
   temperature where applicable, and ordered steps with explicit units.
4. **Given** a drink includes milk, **When** its guide opens, **Then** milk amount
   and temperature are displayed with the other required inputs.
5. **Given** a drink varies by equipment or taste, **When** its guide opens, **Then**
   the variable value is shown as a usable range or with a stated assumption.

---

### User Story 2 - Share a Drink Guide (Priority: P2)

As a visitor, I can send someone a link to a drink guide and know it will open that
same guide, even if they have never visited KamaCafe before.

**Why this priority**: A direct link makes a useful recipe easy to revisit and share.

**Independent Test**: Copy the address of a category or published drink guide,
open it in a fresh browser session, and verify that the correct view appears
without first visiting the home view.

**Acceptance Scenarios**:

1. **Given** a visitor selects a category or drink, **When** its page opens,
   **Then** the browser address changes to that page's designated link.
2. **Given** a visitor opens a shared category or drink link in a fresh session
   or refreshes the page, **When** the app loads, **Then** it displays that view.
3. **Given** a visitor follows a shared link, **When** they use the app's navigation
   or the browser's Back and Forward controls, **Then** the displayed view and
   browser address stay in sync.
4. **Given** a drink's name or category changes, **When** someone opens its
   existing link, **Then** the link still opens that drink's guide.
5. **Given** a shared link names an unknown or removed category or drink,
   **When** someone opens it, **Then** they see an unavailable-page message
   and can return to the home page.

---

### User Story 3 - Brew on a Phone (Priority: P2)

As a visitor using a phone while making coffee, I can quickly read and operate the
drink guide without zooming or horizontal scrolling.

**Why this priority**: Mobile use is the primary usage context.

**Independent Test**: With one published drink, complete the category, drink,
and guide flow on a narrow touch screen and by keyboard.

**Acceptance Scenarios**:

1. **Given** a narrow phone screen, **When** a visitor opens the home, category,
   or drink view,
   **Then** essential guidance remains legible without horizontal scrolling.
2. **Given** a visitor uses touch or keyboard input, **When** they choose a
   category or drink, **Then** the control is operable and the selection is clear.
3. **Given** optional imagery does not load, **When** a guide opens, **Then** the
   quantities and steps remain usable.

---

### User Story 4 - Improve the Guide (Priority: P3)

As a coffee enthusiast, I can find the public project and its contribution instructions
to report a recipe issue or propose a new drink.

**Why this priority**: Community corrections help keep brewing guidance useful and
accurate.

**Independent Test**: From the published app, a visitor can find the public repository
and instructions for issues and pull requests without contacting a maintainer.

**Acceptance Scenarios**:

1. **Given** a visitor notices an error, **When** they look for a way to report it,
   **Then** they can reach the public issue instructions from the app.
2. **Given** a contributor wants to propose a drink, **When** they open the
   contribution instructions, **Then** they can find the required recipe details and
   how to submit a pull request.

### Edge Cases

- A drink without milk MUST omit milk fields rather than show a misleading zero value.
- A published drink with a missing required value MUST be treated as incomplete and
  corrected before publication.
- A drink with a missing category or reusable recipe reference MUST not be published.
- A link to an unknown or removed category or drink MUST show a clear
  unavailable-page view with a way back to home, rather than a blank page.
- Long drink names or steps MUST wrap and remain readable on narrow screens.
- If decorative media fails to load, required brewing information MUST remain available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST use catalog.json as the source of truth for published
  categories, drinks, and recipes. The home view MUST offer every catalog
  category with its name and short description; each category view MUST list
  its drinks in catalog order, with a name, description, preparation time, and
  difficulty. Each guide MUST state
  an estimated caffeine amount in milligrams (mg) per serving; an estimate that
  varies MUST show a range or stated assumption. Category and drink names or
  counts MUST NOT be fixed in the app outside the catalog.
- **FR-002**: A visitor MUST be able to choose a category, choose any drink in
  it, and view its guidance without creating an account.
- **FR-003**: Every drink MUST state its serving size, a one-line description,
  estimated total preparation time in minutes, a difficulty label (Easy, Moderate,
  or Advanced) with a brief explanation, ingredients, and ordered steps.
- **FR-004**: Every published drink MUST provide coffee amount, grind size as a
  qualitative label with an approximate particle-size range in micrometres (µm), water
  amount or target espresso yield, water temperature, and ordered preparation
  steps, either directly or through a valid reusable recipe reference. The
  visitor MUST see complete guidance without resolving references manually.
- **FR-005**: A drink that uses milk MUST include milk amount and milk temperature;
  a drink without milk MUST omit these fields.
- **FR-006**: Each drink MUST include amounts for any additional ingredients and
  any settings needed to reproduce it, such as ice, chocolate, preparation duration,
  or an equipment setting when applicable.
- **FR-007**: Values that depend on equipment or taste MUST appear as a usable range or with an explicit assumption.
- **FR-008**: All displayed quantities and temperatures MUST show their units: grams
  (g) for mass, milliliters (mL) for liquid volume, and degrees Celsius (°C) for
  temperature.
- **FR-009**: The interface and brewing guidance MUST use US English.
- **FR-010**: The drink list and guides MUST remain legible and operable on mobile
  and desktop layouts, including touch and keyboard use.
- **FR-011**: Required brewing guidance MUST remain usable if optional media does not load.
- **FR-012**: The published app MUST be reachable from a custom domain.
- **FR-013**: The app MUST link to the public GitHub project and provide instructions for reporting issues and proposing recipe or feature changes.
- **FR-014**: Catalog entries with missing required fields, duplicate IDs,
  unresolved category or recipe references, or circular recipe references MUST
  be rejected before publication. Category and drink IDs MUST contain only
  lowercase letters, digits, and hyphens so they can form stable address segments.
- **FR-015**: Every independently navigable app view MUST have a designated,
  shareable address. The home view MUST use `/`; each category view MUST use
  `/#category-{category-id}`, and each drink guide MUST use `/#{drink-id}`,
  using stable IDs from catalog.json. For example, Espresso uses `/#espresso`.
- **FR-016**: Selecting a category or drink MUST update the browser address.
  Each category view MUST provide a way back to home; each drink guide MUST
  provide a way back to its category. Direct visits and page refreshes at a
  category or drink address MUST open that view without prior navigation.
- **FR-017**: Browser Back and Forward navigation MUST keep the displayed view
  and address in sync.
- **FR-018**: An address for an unknown or removed category or drink MUST show
  a clear unavailable-page message and a link to home.
- **FR-019**: A category or drink ID MUST NOT be reassigned to a different
  category or drink, so an old shared link cannot silently open unrelated content.
- **FR-020**: The home, category, and drink views MUST follow the minimal Cocoa
  visual design in specs/visual-spec.md: category choices on home, a category's
  drink list, and a drink guide with a description, ingredients, and ordered
  steps. Drink imagery MUST support the content without obscuring guidance.
- **FR-021**: Every recipe explicitly marked scalable MUST show its
  coffee-to-brew-water ratio. Espresso and espresso-based recipes MUST remain
  fixed, one-serving recipes without ratio or scaling controls.
- **FR-022**: A visitor MUST be able to scale a scalable recipe by servings.
  Ingredient quantities, water guidance, and
  quantity-bearing steps MUST update together; temperature, grind, ratio,
  caffeine per serving, and non-scaling batch equipment MUST remain fixed.

### Key Entities *(include if feature involves data)*

- **Drink Category**: A named group of drinks with a stable ID and short
  description in catalog.json; its ID determines the category view's
  shareable address.
- **Drink Recipe**: A named drink with a stable ID, category reference, short
  description, serving size, ingredient quantities, grind size, ordered steps,
  and any drink-specific settings or assumptions. It may reference a reusable
  base recipe that contributes the underlying brewing instructions. Its stable
  ID determines the drink guide's shareable address.
- **Ingredient Guidance**: A quantity and unit for coffee, water, milk, or
  another applicable ingredient; may include a range when precision would mislead.
- **Temperature Guidance**: A water or applicable milk temperature, possibly a range,
  expressed in degrees Celsius.
- **Caffeine Estimate**: An approximate amount in milligrams per serving, with a
  range or assumption when a single value would mislead.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid published catalog categories appear on home, and
  100% of their drinks appear in the correct category with a selectable guide,
  stated serving size, and caffeine estimate in milligrams per serving.
- **SC-002**: 100% of published drinks state serving size, preparation time,
  difficulty with explanation, ingredients, coffee and water guidance, grind
  size, water temperature, and ordered steps after any reusable recipe is
  resolved. Every milk-using drink also states milk amount and temperature.
- **SC-003**: On a mid-range phone with a typical 4G connection, the drink list
  and essential guidance for a selected drink become usable within 3 seconds in
  at least 9 of 10 measured visits.
- **SC-004**: At viewport widths from 320 to 1440 pixels, all primary flows work
  without horizontal scrolling, and all controls are operable by touch and keyboard.
- **SC-005**: Every published category and drink link opens the correct view
  when visited directly and after refresh; Back and Forward navigation returns
  to the expected views and addresses.

## Assumptions

- Each guide states an approximate serving size; ingredient ranges or foam can
  change the final drink volume.
- Categories, drinks, and recipes may be added, removed, or reordered by updating
  catalog.json and publishing the updated static site.
- Category and drink IDs remain stable when names or ordering change so existing
  shared links continue to work. Removed or unknown IDs use the unavailable-page
  view. The chosen hash addresses allow direct visits and refreshes on the
  static host without an application server.
- The baseline does not include accounts, payments, search, reviews, user-generated recipes inside the app, or live personalization.
- Contributions are handled through the public project's issue and pull request process, rather than through forms inside the app.
- Maintainers review recipe content for completeness and internal consistency before publication.
- Delivery follows the constitution's static hosting and custom-domain constraints. The baseline does not require offline use.
