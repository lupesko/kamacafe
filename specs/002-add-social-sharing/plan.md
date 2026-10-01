# Implementation Plan: Social Sharing Metadata

**Branch**: `002-add-social-sharing` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-add-social-sharing/spec.md`

## Summary

Publish one crawler-visible, site-wide KamaCafé social preview from the static
entry document. Add the required Open Graph website fields, recommended
description/site/image fields, and a large-image card signal; derive absolute
URLs from a build-time `VITE_SITE_URL`; add a dedicated 1200×630 Cocoa-themed
PNG; and fail builds or production releases when the rendered metadata or image
does not satisfy the contract. Hash routes retain one shared preview because URL
fragments are not sent to crawlers.

## Technical Context

**Language/Version**: TypeScript 5.9 on Node.js 24; HTML5; PNG

**Primary Dependencies**: Vite 8 and existing `tsx`; Preact 10 remains the app
runtime, but the feature adds no runtime or development dependency

**Storage**: Static metadata in `index.html`, one version-controlled PNG in
`public/images`, and the built copies in S3; no database or service

**Testing**: Vitest for metadata/URL/image validation, Playwright for initial
response and route consistency, the existing Lighthouse mobile gate, and
post-deploy social preview inspectors

**Target Platform**: Static web app hosted on Amazon S3 behind Cloudflare;
Open Graph consumers and large-image card consumers that fetch initial HTML
without executing JavaScript

**Project Type**: Client-only static single-page web application plus existing
deployment infrastructure

**Performance Goals**: Preserve the existing Lighthouse mobile performance
score of at least 90 and essential-guidance usability within 3 seconds; add no
runtime request or script for metadata

**Constraints**: No SSR or application server; hash routes expose one HTTP
document; production URLs must be absolute HTTPS values from the protected
deployment hostname; initial HTML must be sufficient; share image must be
1200×630 PNG and crop-safe; no tracking or social SDK

**Scale/Scope**: One site-wide metadata object, one preview image, the home URL
and all current/future hash routes; per-route previews, share buttons, analytics,
and social account integration are excluded

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Design evidence | Status |
|---|---|---|
| Useful Brewing Guidance | Metadata is isolated to the document head and does not change recipe content, measurements, or guide rendering. | PASS |
| Simplicity, Beauty, and Speed | One static metadata block, one image, native Vite substitution, and a Node-built-in validator add no runtime dependency, service, or request. | PASS |
| Mobile Usability | No control or layout changes are introduced; existing mobile, accessibility, and overflow checks remain required. | PASS |
| Open Collaboration | Copy, image, configuration, validation, and manual inspection steps are versioned and documented for contributors. | PASS |
| Maintainable Changes | Exact metadata, URL rules, PNG properties, response behavior, and regressions receive automated checks. | PASS |
| Static Hosting | All output remains static and is uploaded through the existing S3/Cloudflare path. | PASS |
| Secrets | The hostname is a non-secret protected deployment variable; no credential or user data is introduced. | PASS |

**Post-design re-check**: PASS. The Phase 1 design adds one HTML contract and
build/deployment verification around existing static assets. It introduces no
new architecture, dependency, public API, state, or constitutional exception.

## Project Structure

### Documentation (this feature)

```text
specs/002-add-social-sharing/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── social-preview-contract.md
└── tasks.md                         # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
index.html                           # Static OG/card/canonical metadata
.env.example                        # Local VITE_SITE_URL fixture
package.json                        # Build and social-validation scripts
public/
└── images/
    └── social-preview.png           # New 1200×630 preview asset
scripts/
└── validate-social-metadata.ts      # Built HTML/URL/PNG contract validator
tests/
├── unit/
│   └── social-metadata.test.ts      # Validator failure matrix and asset checks
├── e2e/
│   └── social-sharing.spec.ts       # Initial HTML and hash-route consistency
└── performance/
    └── lighthouserc.json            # Existing regression gate; no rule change
playwright.config.ts                 # Non-production metadata URL fixture
.github/workflows/
├── ci.yml                           # Deterministic CI metadata URL
└── deploy.yml                       # Real production URL and strict pre-upload gate
README.md                            # Local setup, scope, and verification
infra/
└── README.md                        # SITE_HOSTNAME derivation and cache behavior
```

**Structure Decision**: Keep metadata in the current root HTML entry so it is
available before JavaScript. Put the stable image under `public/images` so the
existing Vite copy and S3 image upload handle it. Use one `scripts/` validator,
implemented with Node built-ins, for both post-build and strict production
checks rather than adding a plugin or parser package.

## Implementation Sequence

1. Add failing unit tests for exact metadata/card fields, URL validation modes,
   unresolved values, duplicate/missing tags, and PNG signature/dimensions.
2. Add the 1200×630 Cocoa-themed preview asset and implement the post-build
   validator with generic and `--production` modes.
3. Add the static metadata/canonical tags to `index.html`, using
   `%VITE_SITE_URL%` only for the canonical root and same-origin image URL.
4. Gate `npm run build` with generic validation; configure `.env.example`, CI,
   and Playwright with the explicit non-production `.test` origin.
5. Pass `https://${SITE_HOSTNAME}` during deployment, run strict validation
   before any upload, and ensure a changed social image is purged from the
   existing stable-image cache path.
6. Add response-level Playwright coverage, run the existing full regression and
   performance suites, then update maintainer and infrastructure documentation.
7. After deployment, confirm the initial HTTPS response, image headers, and
   previews in two Open Graph inspectors and one large-image card inspector;
   record platform-cache refreshes separately from origin/CDN verification.
