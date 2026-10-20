# Deployment Validation

Never record token values, account sessions, private identifiers, or unredacted
provider responses in this file.

## Historical local implementation evidence

The 2026-09-28 baseline validated the catalog, TypeScript, unit tests, Vite
build, and the then-planned Terraform declarations. No production infrastructure
was applied. That AWS/S3/Terraform delivery path was superseded on 2026-10-19 by
`003-managed-static-deployment`; its declarations and pending operator tasks are
not authorization to create those resources.

The historical browser limitation also remains relevant: the prior Codex macOS
sandbox denied browser Mach service registration. Browser assertions were left
enabled for normal terminals and Ubuntu CI.

## Managed static implementation

Date: 2026-10-19

| Check | Result | Evidence |
|---|---|---|
| Wrangler dependency | PASS | Wrangler 4.151.2 locked in `package-lock.json`; Node 24 remains required |
| Static host configuration | PASS | `wrangler.jsonc` defines assets-only `dist/`, real-path 404, Version URLs, disabled stable `workers.dev`, and the exact Custom Domain |
| Response policy | PASS | `public/_headers` defines HTML revalidation, immutable hashed assets, finite stable-image caching, security headers, and Version URL `noindex` |
| Configuration tests | PASS | Unit coverage rejects runtime scripts/bindings, platform-limit overflow, malformed headers, active legacy dependencies, and credential material |
| Release identity tests | PASS | Structured upload parsing requires one immutable version, full revision, noncanonical HTTPS preview, passing gates, and matching version tag |
| Promotion workflow contract | PASS | One candidate build/upload feeds one protected exact-version 100% promotion with no rebuild |
| Rollback workflow contract | PASS | Explicit version and reason, protected environment, no build/upload, and post-rollback public verification |

Append final command versions and results under “Local completion evidence” when
T027 finishes.

## One-time Cloudflare control plane

Complete these fields during T012. Store only status and redacted identifiers.

- `lupesko.com` zone active: PASS — public DNS delegates to Cloudflare
  nameservers `alex` and `lilith`; dashboard status still requires operator
  confirmation
- MFA and recovery path confirmed: PENDING
- No conflicting `kamacafe` DNS record: PASS — public DNS returned no A, AAAA,
  or CNAME record on 2026-10-19
- Empty `kamacafe` Worker created interactively: PENDING
- Version URLs enabled: PENDING
- `kamacafe.lupesko.com` Custom Domain active: PENDING
- Managed certificate active: PENDING
- HTTPS enforcement: PENDING — record `Always Use HTTPS` or hostname-scoped Single Redirect

The interactive bootstrap may use Worker Admin and Zone Workers Routes Write.
Those elevated capabilities must not be copied into recurring CI.

## Recurring Cloudflare and GitHub configuration

Complete these fields during T018 without recording the token.

- Per-Worker Editor token for `kamacafe`: PENDING
- `candidate` environment restricted to `main`: PASS — custom deployment branch policy contains only `main`
- Candidate environment secret `CLOUDFLARE_API_TOKEN`: PENDING
- Candidate environment variable `CLOUDFLARE_ACCOUNT_ID`: PENDING
- Production environment secret `CLOUDFLARE_API_TOKEN`: PENDING
- Production environment variable `CLOUDFLARE_ACCOUNT_ID`: PENDING
- Protected `main`: PASS — strict `application` check, linear history, resolved conversations, admin enforcement, and no force-push/deletion
- `production` environment restricted to `main`: PASS — custom deployment branch policy contains only `main`
- Required reviewer: PASS — `lupesko`
- Self-review prevention: EXCEPTION — disabled because `lupesko` is the repository's only direct collaborator; the operator explicitly accepted self-approval on 2026-10-19

Cloudflare's per-Worker Editor capability can both upload and deploy. The
separation between candidate creation and production promotion is therefore
enforced by the reviewed workflow, branch protection, and GitHub environment;
it is not an independent Cloudflare authorization boundary.

## Release candidate contract

Every candidate record contains:

- `versionId`: the immutable Cloudflare Worker version ID;
- `sourceRevision`: the full Git commit SHA used for the only build;
- `versionUrl`: the unique noncanonical HTTPS Version URL;
- `canonicalOrigin`: exactly `https://kamacafe.lupesko.com`;
- `createdAt`, all required check results, and `artifactIdentity`;
- status `uploaded`, `eligible`, `rejected`, `promoted`, or `superseded`.

State transitions are `uploaded → eligible` only after all gates pass,
`eligible → promoted` only after protected human approval, and any failed or
abandoned candidate becomes `rejected` or `superseded`. Promotion must deploy
the captured `versionId` tagged with the captured `sourceRevision`; it must not
rebuild, mutate assets, or select the latest version. A failed, cancelled, or
unapproved candidate leaves production unchanged. A smoke failure after
promotion preserves evidence and requires an explicit rollback.

## First production release evidence

Complete during T019.

- Workflow run:
- Source revision:
- Candidate version ID:
- Version URL reviewed:
- Automated gates:
- Approver:
- Approval time:
- Active production version ID:
- Same-version invariant: PENDING
- Canonical verification: PENDING

## Rollback drill evidence

Complete during T025 after two known-good releases exist.

- From version ID:
- Restored version ID:
- Authorized by:
- Start/verified timestamps:
- Duration (target ≤5 minutes):
- Canonical verification:
- Intended current version restored:

## Local completion evidence

Recorded 2026-10-19:

| Check | Result | Evidence |
|---|---|---|
| Local runtime | PASS WITH VERSION NOTE | Node 25.4.0 and npm 11.17.0 were available locally; `.nvmrc`, package engines, and CI remain pinned to Node 24 |
| Catalog validation | PASS | 2 categories and 11 drinks validated |
| Type checking | PASS | `tsc --noEmit` completed without errors |
| Unit tests | PASS | 8 files, 88 tests |
| Production build | PASS | Vite 8.3.1 produced canonical `dist/` output |
| Strict social validation | PASS | Canonical origin and 1200×630 PNG validated |
| Deployment validation | PASS | 18 deployable files, 14,381,514 bytes, 6 header rules |
| Wrangler dry run | PASS | Wrangler 4.151.2 read 20 static assets, found no bindings, and exited without upload |
| GitHub Actions validation | PASS | actionlint 1.7.12 accepted CI, deployment, and rollback workflows |
| Playwright response checks | PASS | 12 non-browser response/social metadata checks passed |
| Playwright browser checks | ENVIRONMENT BLOCKED | 100 browser cases could not launch because Playwright 1.58.2 browser build 1243 was absent; download retried inside and outside the sandbox but the machine TLS chain returned `SELF_SIGNED_CERT_IN_CHAIN` |
| Lighthouse | ENVIRONMENT BLOCKED | LHCI healthcheck could not find Chrome; no assertion or budget was disabled |
| Active provider/secret audit | PASS | No active legacy-provider command/reference or secret-like material found in workflows, scripts, configuration, public files, or `dist/` |
| Whitespace validation | PASS | `git diff --check` reported no errors |

CI continues to install the locked Playwright browsers and run the full suite on
Ubuntu. A CI run remains required before production approval.
