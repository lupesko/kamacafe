---

description: "Dependency-ordered implementation tasks for managed static deployment"
---

# Tasks: Managed Static Deployment

**Input**: Design documents from `/specs/003-managed-static-deployment/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/hosting-contract.md`, `contracts/release-contract.md`, and
`quickstart.md`

**Tests**: Deployment configuration, structured version output, workflow gates,
public-host verification, and all existing application checks are required. Add
the listed failing tests before their corresponding implementation.

**Organization**: Tasks are grouped by user story so the static host, manual
promotion, and operational retirement/rollback outcomes remain traceable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because the task changes different files and
  does not depend on an incomplete task in the same wave.
- **[Story]**: Maps the task to User Story 1, 2, or 3 in `spec.md`.
- Every task names the exact file or file set it changes or records evidence in.

## Phase 1: Setup (Shared Tooling)

**Purpose**: Add the locked hosting CLI without changing production behavior.

- [X] T001 Add the current compatible Wrangler 4.x release as a development dependency, update `package-lock.json`, and preserve the Node.js 24 engine contract in `package.json` and `package-lock.json`
- [X] T002 [P] Ignore local Wrangler state, dry-run output, and structured CLI output without ignoring checked-in hosting configuration in `.gitignore`

---

## Phase 2: Foundational (Blocking Validation Primitives)

**Purpose**: Create provider-output and configuration validation primitives used
by every deployment story.

**⚠️ CRITICAL**: Complete these test-first tasks before implementing the host or
release workflows.

- [X] T003 [P] Add failing unit tests for configuration inspection, asset-count and 25 MiB file limits, the 100-rule/2,000-character header limits, forbidden runtime entry points, forbidden legacy provider dependencies, and secret-pattern rejection in `tests/unit/deployment-config.test.ts`
- [X] T004 [P] Add failing unit tests for a `ReleaseCandidate` parser requiring exactly one structured version-upload record with a nonblank immutable `versionId`, full Git commit `sourceRevision`, HTTPS noncanonical `versionUrl`, exact canonical origin `https://kamacafe.lupesko.com`, and eligible status only after all checks pass in `tests/unit/wrangler-output.test.ts`
- [X] T005 Implement the pure configuration/asset validation functions and command entry point in `scripts/validate-deployment-config.ts`, then expose `validate:deployment` in `package.json` so T003 passes without contacting Cloudflare
- [X] T006 Implement structured Wrangler output parsing in `scripts/parse-wrangler-output.ts`, rejecting zero/multiple upload records, missing identifiers, malformed preview URLs, mismatched commit tags, and any canonical preview host so T004 passes

**Checkpoint**: Deployment inputs and version-upload results can be validated
locally and in CI without cloud mutation.

---

## Phase 3: User Story 1 - Visit the Canonical Production Site (Priority: P1) 🎯 MVP

**Goal**: Produce a directly edge-served static artifact for
`https://kamacafe.lupesko.com` with correct routing, metadata, caching, security,
DNS, TLS, and HTTPS behavior.

**Independent Test**: Build and dry-run the static project, inspect the generated
asset/header contract, then open the custom hostname and verify `/`, both required
hash routes, images, metadata, HTTPS redirect, and a real-path 404.

### Tests for User Story 1

- [X] T007 [US1] Extend `tests/unit/deployment-config.test.ts` with failing repository-level checks that require Worker name `kamacafe`, `dist/` assets, `not_found_handling: "none"`, no `main` or asset binding, `workers_dev: false`, `preview_urls: true`, the exact Custom Domain, root revalidation, immutable `/assets/*`, finite `/images/*`, security headers, and the documented version-host `noindex` pattern

### Implementation for User Story 1

- [X] T008 [US1] Add the assets-only Worker configuration with fixed compatibility date, exact Custom Domain, disabled stable `workers.dev`, enabled Version URLs, `dist/` directory, and explicit real-path 404 handling in `wrangler.jsonc`
- [X] T009 [P] [US1] Add root/HTML revalidation, one-year immutable Vite asset caching, one-day stable image caching, `nosniff`, frame denial, conservative referrer policy, restrictive permissions policy, and version-host `X-Robots-Tag: noindex` rules in `public/_headers`
- [X] T010 [US1] Run `validate:deployment` and a Wrangler dry run after the production Vite build, retain all application/browser/performance gates, and remove the Terraform validation job from `.github/workflows/ci.yml`
- [X] T011 [P] [US1] Replace AWS/S3 setup and local-plan instructions with Workers Static Assets build, dry-run, custom-domain, cache-header, and canonical-host validation guidance in `README.md` and `specs/001-kamacafe-baseline/quickstart.md`
- [ ] T012 [US1] In Cloudflare, activate the `lupesko.com` zone, confirm no conflicting `kamacafe` DNS record, create the empty `kamacafe` Worker in an interactive Admin session, enable Version URLs, attach `kamacafe.lupesko.com`, wait for DNS/certificate activation, configure zone-wide Always Use HTTPS or a hostname-scoped Single Redirect, and record only redacted evidence in `specs/001-kamacafe-baseline/deployment-validation.md`

**Checkpoint**: The static-host contract is locally valid and the one-time
custom-domain control plane is ready, without deploying a real KamaCafe release.

---

## Phase 4: User Story 2 - Review and Manually Promote an Exact Release (Priority: P2)

**Goal**: Build and upload one immutable candidate, expose its exact Version URL,
wait for explicit production approval, and promote its captured version ID at
100% without rebuilding.

**Independent Test**: Trigger the workflow from a known `main` commit, inspect
the Version URL and summary while production is unchanged, approve the protected
job, and prove the active version ID equals the uploaded candidate ID.

### Tests for User Story 2

- [X] T013 [P] [US2] Add failing workflow-contract tests requiring manual dispatch from `main`, one build in the candidate job, production URL injection, strict metadata/config validation before upload, structured output parsing, captured candidate outputs, a dependent `production` environment job, exact `versionId@100%` promotion, and no build/upload in the promotion job in `tests/unit/deployment-config.test.ts`
- [X] T014 [P] [US2] Add failing unit tests for public verification of canonical origin, HTTP-to-HTTPS path/query preservation, root and hash-route availability, real-path 404, MIME/cache/security headers, 1200×630 social image metadata, and expected active version ID in `tests/unit/production-deployment.test.ts`

### Implementation for User Story 2

- [X] T015 [US2] Implement deterministic public-host and active-version verification with explicit expected hostname/version inputs, bounded retries for propagation, and secret-free diagnostics in `scripts/verify-production-deployment.ts` so T014 passes
- [X] T016 [US2] Replace the AWS/Terraform/S3 workflow with a `workflow_dispatch`-only candidate job and dependent protected promotion job in `.github/workflows/deploy.yml`; build once, set `WRANGLER_OUTPUT_FILE_PATH`, upload with commit tag/message, parse exactly one version ID/URL, expose the Version URL through the job summary and `environment.url`, verify the tag, and deploy the captured ID at 100% without rebuilding so T013 passes
- [X] T017 [P] [US2] Document the exact candidate fields, `ReleaseCandidate` state transitions, approval checks, same-version invariant, failure semantics, and the Cloudflare Editor permission caveat in `specs/001-kamacafe-baseline/deployment-validation.md`
- [ ] T018 [US2] In Cloudflare, create a per-Worker Editor token for `kamacafe`; in GitHub configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in a main-only `candidate` environment and a reviewer-gated main-only `production` environment, protect `main`, and prevent self-review when another operator is available; record variable names, scopes, and redacted evidence in `specs/001-kamacafe-baseline/deployment-validation.md`
- [ ] T019 [US2] Trigger `.github/workflows/deploy.yml` from the intended `main` revision, inspect the Version URL and source/check/version summary, approve the waiting production job, verify the same version is active at `https://kamacafe.lupesko.com`, and record non-secret release evidence in `specs/001-kamacafe-baseline/deployment-validation.md`

**Checkpoint**: A reviewed immutable candidate is the active production version;
unapproved or failed candidates cannot change production through the workflow.

---

## Phase 5: User Story 3 - Recover and Operate Without Legacy Infrastructure (Priority: P3)

**Goal**: Provide explicit rollback, remove the obsolete AWS/Terraform path, and
leave one documented provider and credential footprint.

**Independent Test**: Restore a prior known-good version without rebuilding,
complete the public smoke contract within five minutes, and audit active files
for zero AWS resources, credentials, state, or legacy origin instructions.

### Tests for User Story 3

- [X] T020 [US3] Add failing workflow-contract tests for an explicit version ID and nonblank reason, protected `production` environment, exact-version rollback without build/upload, post-rollback public verification, and secret-free evidence in `tests/unit/deployment-config.test.ts`

### Implementation for User Story 3

- [X] T021 [US3] Add a manually dispatched, reviewer-gated rollback workflow that validates the target version, records the current version, runs `wrangler rollback` with a reason, verifies the restored canonical site, and writes only version/revision/timing results in `.github/workflows/rollback.yml`
- [X] T022 [US3] Remove `infra/main.tf`, `infra/outputs.tf`, `infra/variables.tf`, `infra/versions.tf`, `infra/production.tfvars.example`, and `infra/README.md` after confirming no active workflow or documentation consumes them
- [X] T023 [P] [US3] Mark incomplete AWS production tasks as superseded by `003-managed-static-deployment`, replace AWS operator guidance with the new release/rollback contract, and preserve historical implementation evidence in `specs/001-kamacafe-baseline/tasks.md`, `specs/001-kamacafe-baseline/deployment-validation.md`, `specs/002-add-social-sharing/tasks.md`, and `specs/002-add-social-sharing/quickstart.md`
- [X] T024 [P] [US3] Document recurring candidate promotion, explicit rollback, 100-version retention, token rotation/revocation, platform-cache versus browser/social-cache behavior, and teardown safeguards in `README.md` and `CONTRIBUTING.md`
- [ ] T025 [US3] After two known-good releases exist, roll back to an explicit earlier version without rebuilding, verify restoration within five minutes, then restore the intended current version and record both drills without secrets in `specs/001-kamacafe-baseline/deployment-validation.md`

**Checkpoint**: The repository and operator path use no AWS or Terraform, and a
known-good immutable release can be restored independently.

---

## Phase 6: Polish & Cross-Cutting Release Evidence

**Purpose**: Complete full regression, real-device, security, and social-preview
acceptance after all selected stories are implemented.

- [X] T026 [P] Update the canonical hostname, Version URL no-index check, real-path 404 check, HTTP redirect preservation, active version ID, and rollback timing fields in `specs/001-kamacafe-baseline/production-smoke.md`
- [X] T027 Run catalog validation, type checking, all unit tests, production build, strict social validation, deployment validation, Wrangler dry run, full Playwright/axe/media-failure suite, Lighthouse, and `git diff --check`; record command versions/results in `specs/001-kamacafe-baseline/deployment-validation.md`
- [ ] T028 Complete the public root/hash/history/header/image checks, ten cold mobile visits with at least nine usable within three seconds, and current Safari keyboard/VoiceOver checks; record results and exceptions in `specs/001-kamacafe-baseline/production-smoke.md`
- [ ] T029 Submit `https://kamacafe.lupesko.com/` to two Open Graph inspectors and one large-image card inspector, request re-scrapes if required, and record inspector names, time, release version, and cache observations in `specs/001-kamacafe-baseline/production-smoke.md`
- [ ] T030 Audit tracked files, workflow output, and the public build for secrets plus active AWS/S3/Terraform references; review and remove the temporary constitution Sync Impact Report before commit; then mark the feature status and completed checklist evidence in `.specify/memory/constitution.md`, `specs/003-managed-static-deployment/spec.md`, and `specs/003-managed-static-deployment/checklists/requirements.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; establishes static host
  configuration and the one-time control plane.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because candidate upload
  requires the bootstrapped Worker and production verification requires the
  active Custom Domain.
- **User Story 3 (Phase 5)**: Code/document cleanup can begin after User Story 2
  implementation, but the rollback drill requires two deployed versions.
- **Polish (Phase 6)**: Depends on every selected story and a successful public
  production deployment.

### User Story Dependency Graph

```text
Setup → Foundation → US1 Static Host → US2 Preview/Promotion → US3 Retirement/Rollback
                                                        └──→ Production Acceptance
```

### Within Each User Story

- Add the specified failing tests before implementation.
- Establish checked-in configuration before CI consumes it.
- Validate/build before any candidate upload.
- Upload and parse the candidate before exposing the approval gate.
- Approve and promote the exact captured ID before public smoke checks.
- Validate replacement automation before deleting legacy infrastructure.
- Create two known-good versions before executing a rollback drill.

### Parallel Opportunities

- T002 can run alongside T001.
- T003 and T004 can run in parallel before T005 and T006.
- T009 and T011 can proceed in parallel after the hosting contract is understood.
- T013 and T014 can run in parallel before T015–T016.
- T017 documentation can proceed while T015–T016 implement the workflow.
- T023 and T024 change distinct documentation groups and can run in parallel
  after T022's deletion scope is confirmed.
- T026 can proceed while automated gates in T027 are prepared.

---

## Parallel Example: User Story 2

```text
Task T013: Define the candidate/promotion workflow contract in tests/unit/deployment-config.test.ts
Task T014: Define public deployment verification in tests/unit/production-deployment.test.ts

After both tests fail as expected:
Task T015: Implement scripts/verify-production-deployment.ts
Task T016: Implement .github/workflows/deploy.yml and structured candidate promotion
```

---

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational validation.
2. Complete User Story 1 configuration and operator bootstrap.
3. Validate the static artifact and custom domain without publishing KamaCafe.
4. Continue directly to User Story 2 for the first constitution-compliant
   production release; do not use `wrangler deploy` as a shortcut.

### Incremental Delivery

1. **Static host**: Checked-in assets-only configuration, headers, CI, and domain.
2. **Controlled release**: Candidate upload, Version URL, approval, exact promotion.
3. **Operations**: Rollback workflow, legacy retirement, and maintenance docs.
4. **Acceptance**: Full automated, phone, accessibility, performance, and social checks.

### Release Safety

- Keep the legacy files until replacement validation and workflow-contract tests
  pass, then delete them before the first accepted production release.
- Never place bootstrap Admin or Zone Workers Routes Write credentials in CI.
- Treat GitHub approval as the promotion policy boundary; Cloudflare's Editor
  permission itself can both upload and deploy.
- Never rebuild after approval or choose a version by "latest" position.

## Notes

- `[P]` tasks operate on different files and have no dependency on incomplete
  work in their wave.
- Human control-plane tasks record only redacted identifiers, scopes, and results.
- Existing social-network caches still require inspector-driven re-scrapes.
- The constitution's temporary Sync Impact Report is intentionally retained for
  review until T030, then removed before commit.
