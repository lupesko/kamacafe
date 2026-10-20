# KamaCafe Constitution

## Core Principles

### I. Useful Brewing Guidance

KamaCafe is built by coffee enthusiasts for fellow coffee enthusiasts. Every published
brewing method MUST tell a consumer how to make the coffee. Guidance MUST include the
coffee amount, grind size, water amount, water temperature, and steps needed to use those
values. Methods that use milk MUST also specify its amount and temperature. Guidance
MUST include any other method-specific inputs needed to reproduce the drink. Measurements
MUST use explicit units: grams (g) for mass, milliliters (mL) for liquid volume, and
degrees Celsius (°C) for temperature. When a value depends on preference or equipment,
the app MUST present a usable range or explain the assumption. This keeps recipes
actionable without suggesting false precision.

### II. Simplicity, Beauty, and Speed

The product MUST remain a focused single page web app for discovering and following coffee
brewing methods. Its design MUST be minimal, with a clear visual hierarchy and restrained
decoration that keeps brewing guidance prominent. The core guidance MUST load without
waiting for nonessential media or scripts. Features and implementation choices MUST have
a clear user benefit.
Contributors MUST prefer the smallest understandable solution that meets the requirement
and MUST justify new dependencies, services, or abstractions. This keeps the app easy to
use, fast to load, attractive, easy to fix, and easy to update.

### III. Mobile Usability

Brewing guidance MUST be readable and usable on a mobile device without horizontal
scrolling or relying on hover. Controls MUST work with touch and keyboard input, and text
and controls MUST remain legible at common mobile viewport sizes. Changes to a user flow
MUST be checked on mobile and desktop layouts. Consumers often use the app while making
coffee, so the essential information must be easy to find and follow.

### IV. Open Collaboration

The project MUST remain open source and accept public issues and pull requests for fixes
and features. Contribution instructions MUST explain how to report a problem, propose a
change, and verify a contribution. Decisions on contributions MUST use the product goals
and this constitution as review criteria. This makes community improvements possible
without losing the app's focus.

### V. Maintainable Changes

Changes MUST keep brewing data and application behavior understandable and easy to edit.
Any behavior change MUST include verification appropriate to its risk; calculations,
recipe transformations, and regressions MUST have automated tests when introduced or
changed. Documentation MUST be updated when user behavior or contributor instructions
change. These checks allow small updates without accumulating avoidable defects.

## Product and Hosting Constraints

KamaCafe MUST be delivered as a responsive static single page web app through a custom
domain. Its core functions MUST work without an application server or request-time
compute. Hosting MUST serve the generated static artifact directly from a managed edge
platform so the project does not maintain a separate public origin. Each production
release MUST create an immutable, identifiable version that can be previewed before a
human explicitly promotes that exact version to production and that can be rolled back
without rebuilding it. The interface and brewing guidance MUST use US English.
Deployment and repository configuration MUST keep credentials and other secrets out of
the public source tree. The public interface MUST prioritize the brewing method,
ingredients, settings, and steps over secondary features.

## Development Workflow

Feature proposals MUST state the consumer problem and acceptance criteria before
implementation. Pull requests MUST describe the user-visible change, note how it was
verified, and update brewing guidance or documentation when relevant. Reviewers MUST
check alignment with the core principles, verify affected behavior, and check mobile
usability and load performance for interface changes. Changes to brewing data or displayed
values MUST be checked for consistent units and recipe proportions.
A change that increases complexity MUST document why simpler alternatives do not meet
the requirement.

## Governance

This constitution governs product and engineering decisions for KamaCafe. Amendments MUST
be proposed through a public pull request that explains the changed rule, its rationale,
and any migration required for existing work. A maintainer MUST review and approve the
amendment before it takes effect. Reviews of subsequent changes MUST check compliance
with the current constitution; exceptions MUST be documented in the relevant pull request
with a reason and a plan to remove the exception when feasible.

The constitution follows semantic versioning. MAJOR changes remove or redefine an
existing rule in a backward-incompatible way. MINOR changes add a rule or materially
expand guidance. PATCH changes clarify wording without changing requirements. The
ratification date records the initial adoption; the last amended date changes whenever
the constitution changes.

**Version**: 3.0.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-10-19
