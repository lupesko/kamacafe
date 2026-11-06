# Feature Specification: Roast-Aware Brewing Recommendations

**Feature Branch**: main (no feature branch created)

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Enhance KamaCafe with Light, Medium, and Dark roast selection; update method-appropriate brewing recommendations and explain each roast's effects on flavor, extraction, water temperature, and grind size while preserving existing behavior, methods, and UI conventions."

## Clarifications

### Session 2026-11-05

- Q: When a visitor selects a roast, should that selection carry across other drink guides during the same visit? → A: Carry one selection across all drink guides during in-app navigation; use Dark by default and reset to Dark on a fresh load.
- Q: When a roast changes the recommended temperature or grind, should matching values embedded in the preparation steps update too? → A: Update roast-dependent values in both recipe facts and preparation steps.
- Q: When a cup tastes sour, weak, bitter, or harsh, should the guide name one method-specific adjustment to try first? → A: No. Troubleshooting an unsatisfactory cup is not existing functionality and is outside this feature's scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a Roast for a Drink (Priority: P1)

As a coffee brewer, I can choose Light, Medium, or Dark roast on a drink guide and immediately see brewing guidance suited to that roast and brewing method.

**Why this priority**: Selecting a roast and receiving useful adjustments is the core value of the feature.

**Independent Test**: Open a guide for each underlying brewing method, switch among all three roast levels, and verify that the displayed temperature, grind guidance, and roast explanation match the selected roast and method.

**Acceptance Scenarios**:

1. **Given** any published drink guide opens on a fresh page load, **When** no roast has been selected since that load, **Then** Dark is selected and Dark-roast guidance is shown.
2. **Given** a drink guide with Medium selected, **When** the visitor selects Light, **Then** the guide presents the Light-roast flavor and extraction characteristics and any method-appropriate hotter-water or finer-grind recommendations.
3. **Given** a drink guide with Medium selected, **When** the visitor selects Dark, **Then** the guide presents the Dark-roast flavor and extraction characteristics and any method-appropriate cooler-water or coarser-grind recommendations.
4. **Given** Light or Dark is selected, **When** the visitor returns to Medium, **Then** the original published recipe values and instructions are restored exactly.
5. **Given** the visitor changes roast, **When** the recommendation refreshes, **Then** coffee amount, brew-water amount or espresso yield, brew ratio, serving count, milk guidance, dilution water, caffeine estimate, and unrelated ingredients remain unchanged unless an existing recipe already changes them for another user-controlled reason.
6. **Given** the visitor selects any roast and navigates to another drink without a fresh page load, **When** the next guide opens, **Then** the same roast remains selected and its method-appropriate guidance is shown.
7. **Given** temperature or grind appears in both recipe facts and preparation steps, **When** the visitor changes roast, **Then** every displayed occurrence updates to the selected roast's target and no prior-roast value remains visible.

---

### User Story 2 - Understand Why the Advice Changes (Priority: P1)

As a beginner, I can read a short, plain-language explanation of how my selected roast is likely to taste, how readily it extracts, and why the recommended temperature and grind do or do not change.

**Why this priority**: An unexplained number change does not help beginners learn or make informed adjustments.

**Independent Test**: Select each roast on one guide and confirm that every state explains flavor, extraction, temperature, and grind in language that does not assume coffee expertise.

**Acceptance Scenarios**:

1. **Given** a roast is selected, **When** the visitor reads its recommendation, **Then** they see a concise description of likely flavor characteristics and whether that roast typically benefits from a more energetic, balanced, or gentler extraction approach.
2. **Given** a recommended temperature or grind differs from Medium, **When** the adjustment is shown, **Then** the guide states the direction of the change and connects it to extraction or flavor in plain language.
3. **Given** a method requires a fixed starting temperature or grind, **When** the roast changes, **Then** the guide explains why that setting stays fixed and identifies the method-appropriate technique that matters instead.

---

### User Story 3 - Receive Method-Appropriate Guidance (Priority: P2)

As a coffee brewer, I receive roast advice that respects how the selected drink is brewed rather than seeing one generic adjustment applied to every drink.

**Why this priority**: The same roast behaves differently across pressure, percolation, immersion, and traditional boiled brewing methods.

**Independent Test**: Compare Light and Dark recommendations for espresso, pour-over, French press, and Turkish coffee and verify each follows the method-specific guidance policy below.

**Acceptance Scenarios**:

1. **Given** an espresso or espresso-based drink, **When** Light is selected, **Then** the espresso guidance targets 94°C and a fine grind of approximately 150–400 µm; **when** Dark is selected, **Then** it targets 90–91°C and a slightly coarser fine grind of approximately 300–600 µm.
2. **Given** a pour-over, **When** Light is selected, **Then** the guidance targets 96°C and a fine-to-medium-fine grind of approximately 400–700 µm; **when** Dark is selected, **Then** it targets 90°C and a medium grind of approximately 700–1000 µm.
3. **Given** a French press, **When** Light is selected, **Then** the guidance targets 96°C and a medium-coarse grind of approximately 800–1100 µm; **when** Dark is selected, **Then** it targets 90°C and a coarse-to-very-coarse grind of approximately 1200–1600 µm.
4. **Given** Turkish coffee, **When** any roast is selected, **Then** room-temperature starting water at about 20°C and an extra-fine grind remain recommended because they define the method, while the roast explanation changes and advises controlled heating appropriate to the roast's solubility.
5. **Given** Medium is selected for espresso, pour-over, French press, or Turkish coffee, **When** the recommendation is shown, **Then** it uses that method's existing published temperature and grind guidance as the balanced reference point.
6. **Given** an espresso-based milk, chocolate, iced, or diluted drink, **When** the roast changes, **Then** its underlying espresso brewing recommendation updates while its milk, chocolate, ice, and dilution guidance remains intact.

---

### User Story 4 - Keep Existing Workflows Intact (Priority: P2)

As a returning visitor, I can use roast guidance without losing existing navigation, recipe scaling, shared links, accessibility, or mobile usability.

**Why this priority**: Roast guidance is an enhancement to the current guide, not a replacement for established behavior.

**Independent Test**: Exercise existing navigation, direct links, browser history, recipe scaling, touch, and keyboard flows before and after changing roast and verify their outcomes are unchanged except for roast-dependent guidance.

**Acceptance Scenarios**:

1. **Given** a scalable recipe has a non-default serving count, **When** the visitor changes roast, **Then** the serving count and scaled quantities remain selected while roast-dependent guidance updates.
2. **Given** a category or drink is opened through an existing shared address on a fresh page load, **When** the page loads, **Then** the same category or drink opens with Dark selected without changing the address contract.
3. **Given** the visitor uses touch or keyboard input on a phone or desktop, **When** they operate the roast selector, **Then** all three options are reachable, the selected option is clearly identified without relying on color alone, and no horizontal scrolling is introduced.

### Edge Cases

- If a published drink reuses another drink's brewing recipe, it MUST receive the roast guidance of the resolved underlying brewing method rather than duplicate or conflicting advice.
- If a recipe has a method-specific fixed grind or starting-water temperature, the setting MUST remain fixed and the explanation MUST say why; the app MUST not invent a misleading adjustment merely to make values differ.
- If roast guidance for a new brewing method or roast level is incomplete, that content MUST be rejected before publication rather than silently falling back to a different method's advice.
- Rapidly switching roast options MUST leave the final visible recommendation consistent with the final selected option.
- A guide MUST never display a temperature or grind target for one roast in recipe facts while showing another roast's target in preparation steps.
- Changing servings before or after changing roast MUST produce the same ingredient quantities and roast recommendation for the final state.
- Long explanations and control labels MUST wrap without obscuring ingredients, settings, or preparation steps on narrow screens.
- If optional imagery fails to load, the roast selector, explanations, and complete brewing guidance MUST remain usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every published drink guide MUST offer exactly three roast choices labeled Light, Medium, and Dark.
- **FR-002**: Dark MUST be selected on every fresh page load. A visitor's subsequent roast selection MUST remain active across all drink guides reached through in-app navigation until the next fresh page load; browser Back and Forward navigation MUST show the same active selection.
- **FR-003**: Changing the roast MUST update all and only the recommendation content declared roast-dependent for the drink's underlying brewing method, without requiring navigation away from the guide.
- **FR-004**: Every roast recommendation MUST state four understandable elements: expected flavor characteristics, relative ease of extraction, a water-temperature target with °C units, and a qualitative grind target with an approximate particle-size range in micrometres (µm).
- **FR-005**: Every changed temperature or grind recommendation MUST explain the direction and purpose of the adjustment in plain language, connecting the adjustment to extraction and expected flavor.
- **FR-006**: When a method keeps temperature or grind fixed across roasts, the recommendation MUST explicitly state that it is unchanged and explain the method constraint.
- **FR-007**: Light-roast guidance MUST describe generally brighter, more acidic, and potentially floral or fruit-forward flavors; explain that less-developed beans often benefit from more extraction energy or exposed surface area; and, except where method constraints apply, recommend a hotter target and/or a finer grind than Medium to promote extraction.
- **FR-008**: Medium-roast guidance MUST describe generally balanced sweetness, acidity, and body; present it as the moderate reference point; and use the existing method recipe as the reference temperature and grind.
- **FR-009**: Dark-roast guidance MUST describe generally deeper roast, cocoa, caramelized, or bittersweet flavors with lower perceived acidity; explain that the more-developed, porous bean structure can release roast-forward flavors quickly even though total extractable material varies by coffee; and, except where method constraints apply, recommend a cooler target and/or a coarser grind than Medium to reduce harsh or bitter results.
- **FR-010**: Espresso-based methods MUST use 94°C and a fine grind of approximately 150–400 µm for Light, the existing 93°C and approximately 200–500 µm fine guidance for Medium, and 90–91°C with a slightly coarser fine grind of approximately 300–600 µm for Dark.
- **FR-011**: Pour-over MUST use 96°C and a fine-to-medium-fine grind of approximately 400–700 µm for Light, the existing 94°C and approximately 500–800 µm medium-fine guidance for Medium, and 90°C with a medium grind of approximately 700–1000 µm for Dark.
- **FR-012**: French press MUST use 96°C and a medium-coarse grind of approximately 800–1100 µm for Light, the existing 94°C and approximately 1000–1400 µm coarse guidance for Medium, and 90°C with a coarse-to-very-coarse grind of approximately 1200–1600 µm for Dark.
- **FR-013**: Turkish coffee MUST retain about 20°C starting water and an approximately 50–200 µm extra-fine grind for all roasts, explain that these settings define the method, and vary the flavor, extraction, and controlled-heating advice by roast.
- **FR-014**: Drinks that reuse an espresso recipe MUST inherit the selected roast's espresso brewing guidance while preserving drink-specific milk, milk temperature, chocolate, ice, dilution water, assembly, and serving instructions.
- **FR-015**: Roast selection MUST NOT change coffee dose, brew-water quantity, espresso yield, brew ratio, serving count, caffeine estimate, or unrelated ingredient quantities unless a future published method explicitly identifies one of those values as roast-dependent and explains the reason.
- **FR-016**: The selected roast and recommendation MUST remain synchronized when a visitor scales a recipe; scaling MUST continue to update the same quantities and quantity-bearing steps it updates today.
- **FR-017**: Roast controls and explanations MUST follow existing visual and language conventions, remain subordinate to essential ingredients and steps, work by touch and keyboard, identify selection without color alone, and remain readable without horizontal scrolling from 320 through 1440 pixels wide.
- **FR-018**: Existing category and drink addresses, direct visits, browser Back and Forward behavior, unavailable-page handling, optional-media fallback, and recipe scaling MUST continue to work unchanged apart from the clarified visit-wide roast selection behavior.
- **FR-019**: Recommendation content MUST use US English and explicit units and MUST be complete for every supported combination of published underlying brewing method and roast before publication.
- **FR-020**: The product MUST continue to function as a focused single-page brewing guide without requiring an account or network access beyond loading the published application.
- **FR-021**: Every roast-dependent temperature and grind value embedded in preparation steps MUST update together with the corresponding recipe facts and explanation. Roast-independent step content MUST remain unchanged.

### Key Entities *(include if feature involves data)*

- **Roast Level**: One of Light, Medium, or Dark; carries beginner-friendly general flavor and extraction characteristics and acts as the visitor's recommendation choice.
- **Brewing Method**: The underlying way a drink's coffee is extracted, such as espresso, pour-over, French press, or Turkish coffee. Reused recipes share one underlying method.
- **Roast Recommendation**: The guidance for one roast level and brewing method, including the target water temperature, grind label and approximate particle-size range, flavor explanation, extraction explanation, and adjustment rationale.
- **Drink Guide State**: The currently displayed drink and serving multiplier together with the visit-wide roast choice. Roast changes affect declared recommendation fields while preserving unrelated guide state; drink navigation preserves the roast choice, while a fresh page load resets it to Dark.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of published drink guides offer Light, Medium, and Dark choices, and 100% of supported brewing-method and roast combinations provide complete flavor, extraction, temperature, grind, and rationale content.
- **SC-003**: Using the reference phone or emulated device profile documented in `quickstart.md`, run 100 roast-change interactions after one warm-up interaction. Measure from the selector's change event until the checked state, four explanation fields, recipe facts, and preparation steps all reflect the selected roast. At least 95 interactions MUST complete within 1,000 milliseconds.
- **SC-004**: For every existing drink, selecting Medium reproduces all pre-feature recipe values and instructions exactly; selecting a roast persists across 100% of in-app drink navigation and resets to Dark on 100% of fresh page loads; changing roast leaves 100% of non-roast-dependent quantities unchanged.
- **SC-005**: Automated and manual regression checks confirm that every existing navigation, direct-link, history, unavailable-page, recipe-scaling, and optional-media scenario still produces its established outcome.
- **SC-006**: At viewport widths from 320 through 1440 pixels, all roast options and explanations remain readable without horizontal scrolling and are fully operable by touch and keyboard.
- **SC-007**: In content review, 100% of changed settings include a plain-language reason and 100% of unchanged method constraints explicitly explain why no setting change is recommended.
- **SC-008**: For every drink and roast combination, 100% of temperature and grind values shown in preparation steps match the corresponding recipe facts, with no value from the previously selected roast remaining visible.

## Assumptions

- Dark is the product's default roast because it is the owner's preferred roast level. Medium remains the compatibility reference that reproduces each existing recipe.
- Roast advice is a practical starting point, not a promise of identical results across grinders, water chemistry, bean age, processing styles, or equipment.
- Temperature and grind influence how quickly and how much coffee is extracted, but neither alone guarantees a flavor outcome. Recommendations therefore use bounded starting targets and avoid presenting roast solubility as an absolute rule.
- Temperature targets describe brewing water. Milk temperature and dilution-water temperature remain drink-specific and do not change with roast.
- A small grind change means moving within or just next to the brewing method's usable range, not adopting another method's grind; exact approximate particle-size ranges will be published with each qualitative label.
- Particle-size ranges are overlapping reference targets aligned with KamaCafe's existing guidance, not promises that identical grinder settings will produce identical particles across equipment.
- The initial scope covers every brewing method currently represented in KamaCafe. Future methods must supply all three roast recommendations before publication.
- Roast choice is visit-wide across drink guides reached through in-app navigation, including browser Back and Forward. A fresh page load resets the choice to Dark. Account-backed synchronization or persistence across fresh loads is outside this feature.
- Troubleshooting or follow-up guidance for a cup that tastes wrong is outside this feature; the feature explains its initial roast-aware recommendations only.
- No new account, community submission, review, or purchasing behavior is included.
