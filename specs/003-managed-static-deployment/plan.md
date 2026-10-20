# Implementation Plan: Managed Static Deployment

**Branch**: `003-managed-static-deployment` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-managed-static-deployment/spec.md`

## Summary

Replace the unlaunched AWS S3, Terraform, and Cloudflare-origin deployment path
with Cloudflare Workers Static Assets at `kamacafe.lupesko.com`. Vite continues
to produce the complete `dist/` artifact. Wrangler uploads that directory as an
immutable Worker version without a Worker script, exposes its version URL for
review, and a separate GitHub job protected by the `production` environment
promotes the captured version ID at 100% without rebuilding. A checked-in
response-header policy preserves the cache contract and prevents provider
preview URLs from being indexed.

## Technical Context

**Language/Version**: TypeScript 5.9 on Node.js 24 LTS; GitHub Actions YAML; Wrangler JSONC configuration

**Primary Dependencies**: Preact 10.27, Vite 8, Wrangler 4.x pinned by `package-lock.json`, Cloudflare Workers Static Assets

**Storage**: Versioned Workers Static Assets only; no application database, object-store origin, or Terraform state

**Testing**: Existing Vitest, Playwright/axe, and Lighthouse suites; production metadata validation; focused deployment-configuration validation; public-host smoke checks

**Target Platform**: Modern browsers served from Cloudflare at `kamacafe.lupesko.com`; GitHub-hosted Linux release runners

**Project Type**: Static client-side web application with CI-managed immutable releases

**Performance Goals**: Preserve Lighthouse performance score of at least 90 and make essential guidance usable within 3 seconds for at least 9 of 10 agreed cold mobile visits

**Constraints**: No Worker script or request-time compute; no separate public origin; no AWS or Terraform in the active path; hash routing remains authoritative; candidate must be previewed before manual promotion of the same version; secrets remain outside Git

**Scale/Scope**: One production hostname, one Worker project, one static artifact collection, and the current catalog/image set; artifacts remain below 20,000 files and 25 MiB per file on the Free plan

## Constitution Check

*GATE: Passed before Phase 0 research and re-checked after Phase 1 design.*

- **I. Useful Brewing Guidance — PASS**: Hosting changes do not alter catalog
  content, units, recipe resolution, or displayed guidance; existing catalog
  gates remain release prerequisites.
- **II. Simplicity, Beauty, and Speed — PASS**: The design removes AWS, public
  origin management, Terraform state, two IAM roles, multi-step object uploads,
  and cache purges. Static assets remain directly edge-served without runtime
  code.
- **III. Mobile Usability — PASS**: Existing responsive, keyboard, accessibility,
  media-failure, and performance suites remain required; production acceptance
  retains the real-phone checks.
- **IV. Open Collaboration — PASS**: Configuration, validation, workflow logic,
  and operator documentation remain public and reviewable; only the deployment
  credential stays in protected GitHub configuration.
- **V. Maintainable Changes — PASS**: Deployment behavior gains focused automated
  validation, end-to-end release evidence, and synchronized contributor/operator
  documentation.
- **Product and Hosting Constraints — PASS**: The artifact is a static SPA served
  directly by a managed edge platform, has no application server or request-time
  compute, is versioned and previewable, requires human promotion of the exact
  candidate, and supports rollback without rebuilding.

Post-design re-check: **PASS**. The design artifacts introduce no application
server, data store, dynamic route, or undocumented exception.

## Project Structure

### Documentation (this feature)

```text
specs/003-managed-static-deployment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── hosting-contract.md
│   └── release-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/workflows/
├── ci.yml                         # retain app gates; remove Terraform validation
└── deploy.yml                     # build/upload candidate, then protected promotion

public/
├── _headers                       # cache, security, and preview no-index policy
└── images/

scripts/
├── validate-catalog.ts
├── validate-social-metadata.ts
└── validate-deployment-config.ts  # static release/configuration contract gate

tests/
├── unit/
│   └── deployment-config.test.ts
├── e2e/
└── performance/

wrangler.jsonc                     # static-assets-only project configuration
package.json                       # Wrangler dependency and validation scripts
package-lock.json
README.md
CONTRIBUTING.md

specs/001-kamacafe-baseline/       # mark obsolete AWS delivery tasks as superseded
specs/002-add-social-sharing/      # replace AWS-oriented release guidance

infra/                             # remove after replacement validation is in place
```

**Structure Decision**: Keep the existing single static-web project. Add one
root Wrangler configuration and one public header policy because both are direct
inputs to the deployable artifact. Keep release orchestration in GitHub Actions
and configuration checks beside the existing TypeScript validation scripts.
Remove the isolated `infra/` subtree once all active documentation and workflows
reference the replacement path.

## Complexity Tracking

No constitution violations require justification. The implementation removes
services and state rather than adding an architectural layer.
