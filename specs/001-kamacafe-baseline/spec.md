# Feature Specification: KamaCafe Baseline

**Feature Branch**: main (no feature branch created)

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "create baseline spec for kamacafe"; informed by the agreed product scope and constitution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a Method and Brew (Priority: P1)

As a coffee enthusiast, I can browse the coffee drinks, choose one, and follow complete
instructions for making it.

**Why this priority**: A usable brewing guide is the core value of KamaCafe.

**Independent Test**: A visitor can choose any listed drink and prepare it using only
the displayed ingredients, settings, and ordered steps.

**Acceptance Scenarios**:

1. **Given** a visitor opens KamaCafe, **When** they view the drink list, **Then**
   they see every published drink under its catalog category, each with a name,
   short description, and estimated caffeine amount.
2. **Given** a visitor selects a drink, **When** its guide opens,
   **Then** they see the ingredient amounts, grind size, water temperature, milk
   temperature where applicable, and ordered steps with explicit units.
3. **Given** a drink includes milk, **When** its guide opens, **Then** milk amount
   and temperature are displayed with the other required inputs.
4. **Given** a drink varies by equipment or taste, **When** its guide opens, **Then**
   the variable value is shown as a usable range or with a stated assumption.

---

### User Story 2 - Brew on a Phone (Priority: P2)

As a visitor using a phone while making coffee, I can quickly read and operate the
drink guide without zooming or horizontal scrolling.

**Why this priority**: Mobile use is the primary usage context.

**Independent Test**: With one published drink, complete the choose-and-follow
flow on a narrow touch screen and by keyboard.

**Acceptance Scenarios**:

1. **Given** a narrow phone screen, **When** a visitor opens the drink list or guide,
   **Then** essential guidance remains legible without horizontal scrolling.
2. **Given** a visitor uses touch or keyboard input, **When** they choose a drink,
   **Then** the control is operable and the selected drink is clear.
3. **Given** optional imagery does not load, **When** a guide opens, **Then** the
   quantities and steps remain usable.

---

### User Story 3 - Improve the Guide (Priority: P3)

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
- Long drink names or steps MUST wrap and remain readable on narrow screens.
- If decorative media fails to load, required brewing information MUST remain available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST use catalog.json as the source of truth for published
  categories, drinks, and recipes. It MUST list every valid catalog drink under
  its referenced category, with a name, short description, and estimated caffeine
  amount in milligrams (mg) per serving. An estimate that varies MUST show a range
  or stated assumption. Category and drink names or counts MUST NOT be fixed in
  the app outside the catalog.
- **FR-002**: A visitor MUST be able to choose any listed drink and view its guidance without creating an account.
- **FR-003**: Every drink MUST state its serving size, a one-line description,
  estimated total preparation time in minutes, a difficulty label (Easy, Moderate,
  or Advanced) with a brief explanation, ingredients, and ordered steps.
- **FR-004**: Every published drink MUST provide coffee amount, grind size, water
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
  be rejected before publication.

### Key Entities *(include if feature involves data)*

- **Drink Category**: A named group of drinks with a stable ID in catalog.json.
- **Drink Recipe**: A named drink with a stable ID, category reference, short
  description, serving size, ingredient quantities, grind size, ordered steps,
  and any drink-specific settings or assumptions. It may reference a reusable
  base recipe that contributes the underlying brewing instructions.
- **Ingredient Guidance**: A quantity and unit for coffee, water, milk, or
  another applicable ingredient; may include a range when precision would mislead.
- **Temperature Guidance**: A water or applicable milk temperature, possibly a range,
  expressed in degrees Celsius.
- **Caffeine Estimate**: An approximate amount in milligrams per serving, with a
  range or assumption when a single value would mislead.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid published catalog drinks appear in their referenced
  categories with a selectable guide, stated serving size, and caffeine estimate
  in milligrams per serving.
- **SC-002**: 100% of published drinks state serving size, preparation time,
  difficulty with explanation, ingredients, coffee and water guidance, grind
  size, water temperature, and ordered steps after any reusable recipe is
  resolved. Every milk-using drink also states milk amount and temperature.
- **SC-003**: On a mid-range phone with a typical 4G connection, the drink list
  and essential guidance for a selected drink become usable within 3 seconds in
  at least 9 of 10 measured visits.
- **SC-004**: At viewport widths from 320 to 1440 pixels, all primary flows work
  without horizontal scrolling, and all controls are operable by touch and keyboard.

## Assumptions

- Each guide states an approximate serving size; ingredient ranges or foam can
  change the final drink volume.
- Categories, drinks, and recipes may be added, removed, or reordered by updating
  catalog.json and publishing the updated static site.
- The baseline does not include accounts, payments, search, reviews, user-generated recipes inside the app, or live personalization.
- Contributions are handled through the public project's issue and pull request process, rather than through forms inside the app.
- Maintainers review recipe content for completeness and internal consistency before publication.
- Delivery follows the constitution's static hosting and custom-domain constraints. The baseline does not require offline use.
