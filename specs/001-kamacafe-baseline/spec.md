# Feature Specification: KamaCafe Baseline

**Feature Branch**: main (no feature branch created)

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "create baseline spec for kamacafe"; informed by the agreed product scope and constitution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a Method and Brew (Priority: P1)

As a coffee enthusiast, I can browse the coffee drinks, choose one, pick the number of
cups I am making, and follow complete guidance for that quantity.

**Why this priority**: A usable brewing guide is the core value of KamaCafe.

**Independent Test**: A visitor can choose any listed drink, set a cup count, and make
that quantity using only the displayed ingredients, settings, and ordered steps.

**Acceptance Scenarios**:

1. **Given** a visitor opens KamaCafe, **When** they view the drink list, **Then**
   they see all 13 specified drinks under Espresso drinks or Brewed drinks, each
   with a name and short description.
2. **Given** a visitor selects a drink and number of cups, **When** its guide opens,
   **Then** they see the ingredient amounts for that cup count, grind size, water
   temperature, and ordered steps with explicit units.
3. **Given** a visitor changes the count from one to three cups, **When** the guide
   updates, **Then** scalable ingredient amounts triple while temperatures and grind
   guidance remain appropriate for the drink.
4. **Given** a drink includes milk, **When** its guide opens, **Then** milk amount
   and temperature are displayed with the other required inputs.
5. **Given** a drink varies by equipment or taste, **When** its guide opens, **Then**
   the variable value is shown as a usable range or with a stated assumption.

---

### User Story 2 - Use Familiar Measurements (Priority: P2)

As a visitor, I can read my selected cup count in metric or imperial units so I can
measure ingredients and temperatures with my available equipment.

**Why this priority**: Both unit systems are required for the guidance to be useful to
the intended audience.

**Independent Test**: Using one complete drink guide for multiple cups, switch unit
systems and verify all quantities and temperatures without changing the drink or count.

**Acceptance Scenarios**:

1. **Given** a guide is displayed in metric units, **When** the visitor selects
   imperial units, **Then** all ingredients and temperatures use appropriate imperial
   units without changing the selected drink or cup count.
2. **Given** a guide is displayed in imperial units, **When** the visitor selects
   metric units, **Then** the original metric guidance returns.
3. **Given** quantities or temperatures are converted, **When** the two presentations
   are compared, **Then** the intended proportions and temperature guidance are
   preserved within the tolerances in Success Criteria.

---

### User Story 3 - Brew on a Phone (Priority: P2)

As a visitor using a phone while making coffee, I can quickly read and operate the
drink guide without zooming or horizontal scrolling.

**Why this priority**: Mobile use is the primary usage context.

**Independent Test**: With one published drink, complete the choose-count-and-follow
flow on a narrow touch screen and by keyboard.

**Acceptance Scenarios**:

1. **Given** a narrow phone screen, **When** a visitor opens the drink list or guide,
   **Then** essential guidance remains legible without horizontal scrolling.
2. **Given** a visitor uses touch or keyboard input, **When** they choose a drink,
   change the cup count, or change units, **Then** the controls are operable and their
   current state is clear.
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
- A cup count outside the supported whole-number range MUST be rejected with a clear
  way to select a valid count.
- Increasing the cup count MUST scale ingredient amounts, including milk, ice, or
  flavorings where applicable; it MUST NOT multiply temperatures or grind sizes.
- A drink requiring several preparation batches at a chosen cup count MUST explain
  that in its steps rather than imply one oversized batch.
- Rounded conversions MUST remain practical to measure while preserving recipe
  proportions and temperature guidance.
- Changing units mid-guide MUST keep the same drink, cup count, and step sequence visible.
- Long drink names or steps MUST wrap and remain readable on narrow screens.
- If decorative media fails to load, required brewing information MUST remain available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST list these drinks under the specified categories, each
  with a name and short description:
  - **Espresso drinks**: Espresso, Latte, Cappuccino, Americano, Mocha, Macchiato,
    Flat white.
  - **Brewed drinks**: Drip coffee, Pour-over, French press, Turkish coffee,
    Cold brew, Iced coffee.
- **FR-002**: A visitor MUST be able to choose any listed drink and view its guidance
  without creating an account.
- **FR-003**: Every drink MUST state the yield of one cup or serving and let the
  visitor select a whole-number cup count from 1 through 12, defaulting to one.
  The visitor MUST be able to change the count while viewing the guide.
- **FR-004**: Changing the cup count MUST scale every ingredient amount from the
  one-cup recipe while keeping temperatures and grind guidance appropriate. If the
  selected count requires multiple batches or different handling, the guide MUST
  explain how to prepare that count.
- **FR-005**: Every published drink MUST include coffee amount, grind size, water
  amount, water temperature, and ordered preparation steps.
- **FR-006**: A drink that uses milk MUST include milk amount and milk temperature;
  a drink without milk MUST omit these fields.
- **FR-007**: Each drink MUST include amounts for any additional ingredients and
  any settings needed to reproduce it, such as ice, chocolate, preparation duration,
  or an equipment setting when applicable.
- **FR-008**: Values that depend on equipment or taste MUST appear as a usable range
  or with an explicit assumption.
- **FR-009**: All displayed quantities and temperatures MUST show their units.
- **FR-010**: Visitors MUST be able to switch all recipe measurements between metric
  and imperial units while staying on the selected drink and cup count.
- **FR-011**: Scaling and unit conversion MUST preserve the intended ingredient
  proportions and temperature guidance within the tolerances in Success Criteria.
- **FR-012**: The interface and brewing guidance MUST use US English.
- **FR-013**: The drink list, guides, cup-count control, and unit control MUST remain
  legible and operable on mobile and desktop layouts, including touch and keyboard use.
- **FR-014**: Required brewing guidance MUST remain usable if optional media does
  not load.
- **FR-015**: The published app MUST be reachable from a custom domain.
- **FR-016**: The app MUST link to the public project and provide instructions for
  reporting issues and proposing recipe or feature changes.

### Key Entities *(include if feature involves data)*

- **Drink Category**: Espresso drinks or Brewed drinks; groups the specified catalog.
- **Drink Recipe**: A named drink with a short description, one-cup yield, ingredient
  quantities, grind size, ordered steps, and any drink-specific settings or assumptions.
- **Ingredient Guidance**: A per-cup quantity and unit for coffee, water, milk, or
  another applicable ingredient; may include a range when precision would mislead.
- **Temperature Guidance**: A water or applicable milk temperature, possibly a range,
  that can be displayed in either unit system.
- **Cup Count**: The visitor's selected whole number of servings, from 1 through 12;
  it changes ingredient totals without redefining the underlying recipe.
- **Unit Preference**: The visitor's current choice of metric or imperial presentation;
  it changes display values without changing the underlying recipe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 9 of 10 first-time testers can choose a drink, set a cup
  count, and find its quantities, settings, and steps within 60 seconds on a phone.
- **SC-002**: All 13 specified drinks appear in the correct category with a
  selectable guide and stated one-cup yield.
- **SC-003**: 100% of published drinks include all universally required fields, and
  100% of milk-using drinks include milk amount and temperature.
- **SC-004**: For every drink at 1, 2, and 12 cups in both unit systems, ingredient
  ratios differ by no more than 2% from the one-cup recipe after rounding, and
  temperatures differ by no more than 1°C (2°F) from their equivalents.
- **SC-005**: On a mid-range phone with a typical 4G connection, the drink list and
  essential guidance for a selected drink become usable within 3 seconds in at least
  9 of 10 measured visits.
- **SC-006**: At viewport widths from 320 to 1440 pixels, all primary flows work
  without horizontal scrolling, and all controls are operable by touch and keyboard.
- **SC-007**: At least 8 of 10 coffee-enthusiast testers say they could make the
  selected drink using the guide without consulting another source.
- **SC-008**: At least 9 of 10 testers can find how to report a recipe issue from the
  published app within 2 minutes.
- **SC-009**: In release verification, the custom domain opens the app and a visitor
  can reach each published drink from the home view.

## Assumptions

- One cup means one serving of the selected drink, with a drink-specific yield shown
  in the guide. The initial supported range is 1 through 12 whole cups.
- The 13 named drinks in FR-001 are the initial catalog; additional drinks are
  outside this baseline.
- Metric is the initial measurement display; visitors can switch to imperial during
  a visit. Remembering the choice across visits is outside this baseline.
- The baseline does not include accounts, payments, search, reviews, user-generated
  recipes inside the app, or live personalization.
- Contributions are handled through the public project's issue and pull request
  process, rather than through forms inside the app.
- Maintainers review recipe content for completeness and internal consistency before
  publication.
- Delivery follows the constitution's static hosting and custom-domain constraints.
  The baseline does not require offline use.
