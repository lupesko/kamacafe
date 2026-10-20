# Tasks: Social Sharing Metadata

**Input**: Design documents from `/specs/002-add-social-sharing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated contract, unit, E2E, and regression tests are required by FR-012 and the implementation plan.

**Organization**: Tasks are grouped by user story so each increment can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no incomplete dependency
- **[Story]**: Maps the task to the corresponding prioritized user story
- Every task names the exact file or files it changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Reconcile the approved contract copy and prepare deterministic build configuration.

- [X] T001 Reconcile the approved description `Clear guides for brewing the perfect coffee.` across `specs/002-add-social-sharing/spec.md`, `specs/002-add-social-sharing/data-model.md`, and `specs/002-add-social-sharing/quickstart.md`
- [X] T002 [P] Add the explicit non-production `VITE_SITE_URL=https://preview.kamacafe.test` build input to `.env.example`, `.github/workflows/ci.yml`, and `playwright.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the fail-closed rendered-output validator used by every user story and release path.

**⚠️ CRITICAL**: User story implementation depends on this validation foundation.

- [X] T003 Add failing table-driven metadata, URL-mode, and PNG-header tests in `tests/unit/social-metadata.test.ts`, including the exact 1200×630 dimensions, `image/png`, exact approved copy, same-origin image path, `.test` generic exception, and strict production rejections from `data-model.md`
- [X] T004 Implement the pure validation helpers and CLI in `scripts/validate-social-metadata.ts` using Node built-ins, with generic and `--production` modes and nonzero failures for every contract violation
- [X] T005 Wire `validate:social` and the post-Vite generic validation gate into `package.json`, then run `tests/unit/social-metadata.test.ts` and confirm the foundational checks pass

**Checkpoint**: Built HTML, canonical/image URLs, exact copy, tag cardinality, unresolved tokens, PNG format, and actual dimensions can be validated without network access.

---

## Phase 3: User Story 1 - Recognizable Shared Link (Priority: P1) 🎯 MVP

**Goal**: A shared KamaCafé URL exposes an immediately recognizable title, description, canonical root, and branded preview image in initial HTML.

**Independent Test**: Build with the `.test` fixture, inspect the raw `/` response without JavaScript, and confirm the required Open Graph fields and 1200×630 image match the contract.

### Tests for User Story 1

- [X] T006 [US1] Add a failing initial-response test for the required title, description, canonical link, `og:title`, `og:type`, `og:url`, and `og:image` fields in `tests/e2e/social-sharing.spec.ts`

### Implementation for User Story 1

- [X] T007 [P] [US1] Generate and visually inspect the Cocoa-themed 1200×630 branded preview in `public/images/social-preview.png`, keeping the KamaCafé name, tagline, bean identity, and coffee imagery legible in centered landscape crops and the file at or below 1 MB
- [X] T008 [US1] Add the approved browser/search copy, canonical link, and required Open Graph website fields to the initial head in `index.html` using `%VITE_SITE_URL%/` and `%VITE_SITE_URL%/images/social-preview.png`
- [X] T009 [US1] Run the focused unit and E2E tests plus `npm run build` to confirm the MVP passes generic rendered-output validation

**Checkpoint**: User Story 1 delivers a complete recognizable Open Graph preview from the static response.

---

## Phase 4: User Story 2 - Consistent Cross-Platform Presentation (Priority: P2)

**Goal**: Open Graph and large-image card consumers reuse one approved identity across home and hash-route URLs.

**Independent Test**: Compare raw metadata for `/`, a category hash, a drink hash, and an unknown hash; confirm identical canonical/social values and the full recommended/card field set.

### Tests for User Story 2

- [X] T010 [US2] Extend `tests/e2e/social-sharing.spec.ts` with failing route-consistency and recommended-field checks for `og:locale`, `og:site_name`, `og:description`, image type/width/height, and `twitter:card=summary_large_image`

### Implementation for User Story 2

- [X] T011 [US2] Add the recommended Open Graph locale/site/description/image fields and large-image card selector to `index.html` without duplicating card title, description, or image content
- [X] T012 [US2] Pass `VITE_SITE_URL=https://${{ vars.SITE_HOSTNAME }}` and run strict validation before cloud credentials/upload in `.github/workflows/deploy.yml`, preserving image-before-HTML upload order and purging `/images/social-preview.png` when changed
- [X] T013 [US2] Run route-consistency checks in `tests/e2e/social-sharing.spec.ts` and strict-validator negative cases in `tests/unit/social-metadata.test.ts` to confirm metadata cannot drift or ship with a placeholder hostname

**Checkpoint**: User Story 2 supplies one maintainable metadata source for Open Graph and large-image card consumers across all hash routes.

---

## Phase 5: User Story 3 - Accessible, Reliable Fallback (Priority: P3)

**Goal**: The preview remains understandable when media is unavailable or a client exposes image alternative text.

**Independent Test**: Read metadata without loading the image and confirm the title/description remain complete and Open Graph/card image alt text matches the approved meaningful description.

### Tests for User Story 3

- [X] T014 [US3] Extend `tests/e2e/social-sharing.spec.ts` with failing image-unavailable and exact `og:image:alt`/`twitter:image:alt` parity checks

### Implementation for User Story 3

- [X] T015 [US3] Add matching meaningful Open Graph and card image alternative text in `index.html` and verify the metadata remains usable when PNG requests fail

**Checkpoint**: All three user stories are independently functional and covered by response-level tests.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Document the operational contract and run the complete repository validation path.

- [X] T016 [P] Document `.env.local` setup, site-wide hash-route scope, social validation commands, and platform cache behavior in `README.md`
- [X] T017 [P] Document `SITE_HOSTNAME` to `VITE_SITE_URL` derivation, strict pre-upload validation, stable image caching, and purge behavior in `infra/README.md`
- [X] T018 Run the full `specs/002-add-social-sharing/quickstart.md` validation sequence, including typecheck, all unit tests, production build, all Playwright projects, and Lighthouse; record any environment-only limitations without weakening automated gates
- [X] T019 Verify every task and acceptance criterion against `specs/002-add-social-sharing/spec.md` and `specs/002-add-social-sharing/contracts/social-preview-contract.md`, then mark all completed tasks in `specs/002-add-social-sharing/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately; T001 and T002 are independent.
- **Foundational (Phase 2)**: Starts after setup. T003 must fail before T004; T005 follows T004.
- **User Story 1 (Phase 3)**: Depends on the validator foundation. T006 precedes T008; T007 can run in parallel with T006; T009 validates the integrated MVP.
- **User Story 2 (Phase 4)**: Depends on the User Story 1 metadata source. T010 precedes T011; T012 can proceed after the contract shape is stable; T013 validates both.
- **User Story 3 (Phase 5)**: Depends on the shared metadata block. T014 precedes T015.
- **Polish (Phase 6)**: T016 and T017 can run in parallel after behavior stabilizes; T018 and T019 are final sequential gates.

### User Story Dependencies

- **User Story 1 (P1)**: First deployable increment after the foundation.
- **User Story 2 (P2)**: Reuses User Story 1 values and adds interoperability, route consistency, and release wiring.
- **User Story 3 (P3)**: Reuses the same metadata and adds accessible fallback semantics.

### Parallel Opportunities

- T001 and T002 touch different files.
- T007 can run while T006 is being authored because the asset and response test are separate files.
- T016 and T017 update separate documentation roots.

## Parallel Example: User Story 1

```text
Task T006: Add the initial-response E2E contract in tests/e2e/social-sharing.spec.ts
Task T007: Generate and inspect public/images/social-preview.png
```

## Implementation Strategy

### MVP First

1. Complete setup and the validator foundation.
2. Complete User Story 1 and stop for the focused build/E2E checkpoint.
3. Add cross-platform consistency and deployment enforcement.
4. Add accessible fallbacks.
5. Finish documentation and the full regression/performance gate.

### Incremental Delivery

- **MVP**: Static required Open Graph preview plus branded image.
- **Increment 2**: Recommended fields, large-card interoperability, hash-route consistency, and strict deployment validation.
- **Increment 3**: Accessible image fallback and failure behavior.
- **Final**: Maintainer documentation and full quickstart verification.

## Notes

- Tests must be written and observed failing before the corresponding implementation.
- The edited social-preview contract is authoritative for exact copy.
- No new npm dependency, runtime request, tracker, social SDK, server, or Terraform resource is permitted.
- Do not overwrite or revert unrelated worktree changes.

---

## Phase 7: Production Deployment & Social Preview Verification

**Purpose**: Complete the remaining operator setup, deploy the approved feature through the existing AWS/GitHub/Cloudflare path, and verify the public metadata and image.

> **Superseded 2026-10-19:** Tasks T020-T032 below are retained as historical
> planning evidence but MUST NOT be executed. Their managed-static replacements
> are `specs/003-managed-static-deployment/tasks.md` T012, T018-T019, and
> T027-T029.

**Independent Test**: From the public HTTPS hostname, verify the initial HTML contains the contract values, the share image returns HTTP 200 as `image/png` at 1200×630, and at least two Open Graph inspectors plus one large-image card inspector show the approved preview after any needed cache refresh.

### Operator setup — AWS

- [~] T020 Superseded hostname/AWS-region selection task; canonical hostname is now `kamacafe.lupesko.com` and no AWS region is used.
- [~] T021 Superseded Terraform-state bucket task; the active path has no Terraform state.
- [~] T022 Superseded AWS OIDC provider task; the active path has no AWS identity.
- [~] T023 Superseded AWS bootstrap-role task; the active path has no AWS role.

### Operator setup — Cloudflare and GitHub

- [~] T024 Superseded DNS/CNAME task; T012 creates a Worker Custom Domain with managed DNS and TLS.
- [~] T025 Superseded zone-token task; T018 uses a per-Worker Editor token.
- [~] T026 Superseded environment-variable list; T018 requires only `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, branch protection, and the reviewed `production` environment.
- [~] T027 Superseded tfvars task; no local production variable file is used.

### Provision, deploy, and verify

- [~] T028 Superseded infrastructure plan; T027 validates the Workers artifact and dry run.
- [~] T029 Superseded plan/apply workflow; T016 uploads a candidate and promotes the exact reviewed version.
- [~] T030 Superseded production apply; T019 performs reviewed exact-version promotion.
- [~] T031 Superseded hostname placeholder smoke check; T019 and T028 verify `https://kamacafe.lupesko.com`.
- [~] T032 Superseded inspector task; T029 retains the same social-platform acceptance under the new release ID.

### Deployment dependencies and execution order

- T020 is the input decision for T021–T027; complete the AWS account/role/state and Cloudflare zone/token setup before configuring GitHub.
- T028 depends on T020–T027. Do not apply while the Terraform plan contains unresolved placeholders or unreviewed DNS/ruleset changes.
- T029 depends on T028 and must be complete before the production run. T030 depends on a reviewed plan, configured GitHub environment, and passing CI. T031 depends on a successful deployment; T032 follows origin/CDN verification so platform caches are not confused with origin errors.
- The feature's production release depends on the site infrastructure tasks T059–T061 in `specs/001-kamacafe-baseline/tasks.md`; coordinate these checklists so the same AWS/Cloudflare setup is completed once and recorded in `specs/001-kamacafe-baseline/deployment-validation.md`.

### Parallel opportunities

- T021 (AWS state bucket/OIDC preparation) and T024–T025 (Cloudflare zone/token preparation) can proceed in parallel after T020.
- T026–T027 depend on the identifiers produced by AWS and Cloudflare setup. T028–T032 are sequential release gates after the stated AWS/Cloudflare preparation parallelism.

### Deployment MVP

Complete T020–T031 to publish and verify the production origin/CDN preview. T032 completes cross-platform cache and presentation verification. The pre-deployment `.test` build is not production acceptance.
