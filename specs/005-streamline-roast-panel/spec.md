# Feature Specification: Streamlined Roast Panel

**Feature Branch**: main (no feature branch created)

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Keep Light, Medium, and Dark roast selection visible without label wrapping; rename the panel to 'Pick your roast'; and collapse the explanatory roast information by default so it uses less screen space."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick a Roast Without Label Wrapping (Priority: P1)

As a coffee brewer, I can immediately see and select Light, Medium, or Dark without any option label splitting across lines.

**Why this priority**: Roast selection is the panel's primary action, and a wrapped label makes that action harder to scan and less polished.

**Independent Test**: Open any published drink guide at supported phone, tablet, and desktop widths and verify that the panel is titled "Pick your roast," all three options are visible together, and each option label remains on one line.

**Acceptance Scenarios**:

1. **Given** any published drink guide, **When** the roast panel appears, **Then** its heading reads "Pick your roast" exactly.
2. **Given** the guide is viewed at any supported width from 320 through 1440 pixels, **When** the visitor views the roast choices, **Then** Light, Medium, and Dark are all visible and each label remains on a single line.
3. **Given** any roast is selected, **When** the visitor selects another roast, **Then** the selected state and roast-dependent brewing guidance update exactly as they do today.

---

### User Story 2 - Keep Explanations Compact Until Needed (Priority: P1)

As a coffee brewer, I can see the roast choices without giving up a large part of the screen to explanatory text, and I can reveal that text when I want more context.

**Why this priority**: Reducing the default footprint is the main usability improvement while retaining the educational value of the existing explanations.

**Independent Test**: Open a drink guide, confirm the explanation is collapsed while the selector remains visible, expand the explanation to read all existing guidance, and collapse it again without changing the selected roast.

**Acceptance Scenarios**:

1. **Given** a drink guide has just opened, **When** the roast panel is displayed, **Then** the roast choices and current selection are visible while the explanatory roast details are collapsed.
2. **Given** the explanatory details are collapsed, **When** the visitor activates the expansion control, **Then** the complete explanation for the selected roast becomes visible and the control communicates that the details are expanded.
3. **Given** the explanatory details are expanded, **When** the visitor activates the collapse control, **Then** only the explanatory details are hidden while the heading, roast choices, and current selection remain visible.
4. **Given** the explanatory details are collapsed, **When** the visitor changes roast, **Then** the recipe guidance updates immediately without automatically expanding the details.
5. **Given** the explanatory details are expanded, **When** the visitor changes roast, **Then** the panel stays expanded and displays the explanation for the new selection.

---

### User Story 3 - Operate the Compact Panel Accessibly (Priority: P2)

As a visitor using touch, keyboard navigation, or assistive technology, I can understand and operate both the roast selector and the explanation control.

**Why this priority**: Saving space must not make the existing selection workflow or supporting information harder to reach.

**Independent Test**: Use touch and keyboard input to select each roast and toggle the details, verifying that focus remains visible, the selected roast is communicated without color alone, and the expanded or collapsed state is announced.

**Acceptance Scenarios**:

1. **Given** keyboard input, **When** the visitor moves through the panel, **Then** each roast choice and the explanation control can be reached and activated with a visible focus indicator.
2. **Given** an assistive technology reads the panel, **When** the explanation control is encountered, **Then** its purpose and current expanded or collapsed state are communicated.
3. **Given** the details are toggled, **When** the visibility changes, **Then** focus is not unexpectedly moved and the selected roast remains identifiable without relying on color.

### Edge Cases

- At the narrowest supported viewport and with enlarged text, the three roast labels must remain readable without splitting words or introducing horizontal page scrolling.
- The longest label, Medium, must remain on one line in selected and unselected states.
- Rapidly switching roasts while the details are collapsed must leave the final selected option and all brewing guidance synchronized.
- Rapidly toggling the explanation must leave the visible content consistent with the final expanded or collapsed state.
- Long roast explanations must remain readable when expanded without covering or displacing the always-visible selector.
- Opening another drink guide or reloading the current guide must present that guide's explanation collapsed by default while preserving the established roast-selection behavior for that navigation type.
- If optional drink imagery fails to load, the compact selector and explanation control must remain usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every published drink guide MUST label the roast panel "Pick your roast" exactly.
- **FR-002**: The Light, Medium, and Dark choices and the current selected state MUST remain visible whether the explanatory details are expanded or collapsed.
- **FR-003**: Each roast-choice label MUST remain on one line at supported viewport widths from 320 through 1440 pixels, without clipping, overlapping another control, or causing horizontal page scrolling.
- **FR-004**: The explanatory details MUST be collapsed by default whenever a drink guide is newly opened or reloaded.
- **FR-005**: The panel MUST provide a clearly labeled control that lets visitors expand and collapse the explanatory details and communicates the current state.
- **FR-006**: Expanding the details MUST reveal all existing explanation content for the selected roast, including its starting-point heading and its flavor, extraction, temperature, and grind guidance.
- **FR-007**: Collapsing the details MUST hide only the explanatory content; it MUST NOT hide or disable the panel heading, roast choices, selected state, or selection behavior.
- **FR-008**: Selecting a roast MUST continue to update the recipe facts, preparation steps, and selected-roast explanation regardless of whether the explanatory details are visible.
- **FR-009**: Changing the selected roast MUST preserve the current expanded or collapsed state of the explanation for the current drink guide.
- **FR-010**: When the visitor opens a different drink guide, its explanatory details MUST start collapsed; persistence of explanation visibility across drink navigation or page loads is outside this feature.
- **FR-011**: Roast choices and the explanation control MUST work with touch and keyboard input, have visible focus states, and expose their selected and expanded or collapsed states without relying on color alone.
- **FR-012**: Hidden explanatory details MUST not be presented as visible content to assistive technology, while the control to reveal them MUST remain discoverable.
- **FR-013**: Existing roast defaults, visit-wide roast selection, brewing recommendations, serving scaling, navigation, direct links, and browser history behavior MUST remain unchanged.
- **FR-014**: At phone, tablet, and desktop reference widths, the collapsed panel MUST be at least 40% shorter than its expanded state and MUST NOT introduce horizontal page scrolling.

### Key Entities *(include if feature involves data)*

- **Roast Selection**: The existing Light, Medium, or Dark choice that determines roast-aware brewing guidance and remains available at all times.
- **Explanation Visibility**: A per-guide interface state with collapsed and expanded values. It starts collapsed for each newly opened guide and does not alter the roast selection or brewing recommendation.
- **Roast Explanation**: The existing starting-point, flavor, extraction, temperature, and grind information associated with the selected roast; it is hidden or revealed as one group.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of published drink guides display the exact heading "Pick your roast" and show their explanatory details collapsed when newly opened.
- **SC-002**: At every tested viewport width from 320 through 1440 pixels, 100% of Light, Medium, and Dark labels remain on one line with no clipping, overlap, or horizontal page scrolling.
- **SC-003**: At phone, tablet, and desktop reference widths, the collapsed panel is at least 40% shorter than the same panel with its explanation expanded.
- **SC-004**: Visitors can reveal or hide the complete explanation with one interaction while the roast selector and current selection remain visible throughout.
- **SC-005**: In 100% of tested roast changes made while details are collapsed, recipe facts and preparation steps update to the final selection, and expanding afterward shows the matching explanation.
- **SC-006**: Touch, keyboard, and assistive-technology checks can select all three roasts and toggle the explanation in 100% of supported interaction scenarios, with the selected roast and explanation state communicated without color alone.
- **SC-007**: Regression checks confirm that 100% of established roast defaults, visit-wide selection, serving scaling, navigation, direct-link, and browser-history scenarios retain their existing outcomes.

## Assumptions

- The existing roast explanation wording and brewing recommendations remain unchanged; this feature changes their presentation and visibility only.
- "Collapsed by default" applies whenever a drink guide is newly opened, including in-app navigation to another guide and page reloads.
- Changing roast on the current guide preserves whether its explanation is expanded or collapsed and never expands it automatically.
- The Light, Medium, and Dark choices remain visible together rather than being replaced by a menu or another interaction that hides options.
- No animated transition is required; immediate expansion and collapse satisfies the feature.
- Existing supported viewport coverage remains 320 through 1440 pixels wide, consistent with the roast recommendation feature.
