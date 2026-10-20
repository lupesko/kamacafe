# Feature Specification: Managed Static Deployment

**Feature Branch**: `003-managed-static-deployment` *(planning identifier; no Git branch was created)*

**Created**: 2026-10-19

**Status**: Implemented locally; production setup and acceptance pending

**Input**: User description: "Replace the AWS/S3/Terraform production path with Cloudflare Workers Static Assets for kamacafe.lupesko.com, using a previewable release version and explicit manual promotion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visit the Canonical Production Site (Priority: P1)

As a coffee enthusiast, I want to open KamaCafe at its permanent secure address
so I can use and share the brewing guides without knowing anything about the
hosting platform.

**Why this priority**: A stable, secure, correctly rendered public site is the
essential outcome of the deployment change.

**Independent Test**: Open the canonical address in a fresh browser and verify
the home page, a category link, a drink link, static media, and sharing metadata
all load over HTTPS with the canonical production origin.

**Acceptance Scenarios**:

1. **Given** the production release is active, **When** a visitor opens
   `https://kamacafe.lupesko.com`, **Then** the complete static application loads
   over HTTPS without contacting a separate application origin.
2. **Given** a visitor opens `/#category-espresso-drink` or `/#espresso`, **When**
   the browser loads or refreshes the address, **Then** the existing hash-routed
   view remains directly usable.
3. **Given** a social crawler reads the production entry document, **When** it
   resolves canonical and image metadata, **Then** every public URL uses
   `https://kamacafe.lupesko.com`.

---

### User Story 2 - Review and Manually Promote an Exact Release (Priority: P2)

As a production approver, I want to inspect the exact release candidate at a
version-specific address before it receives production traffic so approval is
based on the artifact that will actually go live.

**Why this priority**: Manual promotion prevents an unreviewed merge, build, or
configuration change from becoming the public release.

**Independent Test**: Produce a release candidate from a known revision, open
its unique preview, approve it, and verify that production reports and serves
the same immutable release identifier without rebuilding the application.

**Acceptance Scenarios**:

1. **Given** the intended revision passes all required quality checks, **When**
   the release workflow runs, **Then** it creates an immutable candidate and a
   unique preview address without changing production traffic.
2. **Given** an approver has verified the preview, revision, and check results,
   **When** the approver authorizes production, **Then** that exact candidate is
   promoted without a second build or asset mutation.
3. **Given** a candidate fails a check or is not approved, **When** the workflow
   finishes or expires, **Then** the active production version remains
   unchanged.

---

### User Story 3 - Recover and Operate Without Legacy Infrastructure (Priority: P3)

As a maintainer, I want a small, documented hosting footprint with a direct
rollback path so I can operate KamaCafe without maintaining unused cloud
accounts, public origins, infrastructure state, or multi-provider credentials.

**Why this priority**: Simpler operations reduce security exposure and the risk
of deployment mistakes after the initial release path works.

**Independent Test**: Starting from two known release versions, activate the
newer version, restore the earlier version without rebuilding it, and confirm
that all active deployment documentation and automation require only the
managed static host and source-control platform.

**Acceptance Scenarios**:

1. **Given** a faulty production version and a known-good prior version, **When**
   an authorized maintainer initiates rollback, **Then** the prior immutable
   version becomes active without rebuilding its assets.
2. **Given** the new hosting path is accepted, **When** a maintainer audits the
   active automation and documentation, **Then** no production step depends on
   AWS, an S3 origin, Terraform state, or Terraform credentials.
3. **Given** a deployment credential is configured, **When** its access is
   reviewed, **Then** it is stored outside the repository and limited to the
   account and capabilities needed to manage this static site.

### Edge Cases

- A candidate preview succeeds but the production promotion is denied or never
  approved; the candidate must remain inactive.
- The source revision changes after a candidate is created; promotion must still
  reference the reviewed candidate rather than rebuilding the moving branch.
- A candidate has correct assets but contains a placeholder, insecure, local,
  private, reserved, or noncanonical public URL; release creation must fail.
- A production promotion fails partway through; traffic must remain on a complete
  prior version rather than a mixture of entry documents and assets.
- A stable image path changes between versions while browsers or social platforms
  retain their own caches; operator guidance must distinguish client/platform
  caching from the active hosting version.
- A missing real URL path must return an appropriate not-found response; hash
  routes continue to work because URL fragments are interpreted by the browser.
- The provider-generated development hostname or a version-preview hostname is
  discovered by a crawler; it must not become the canonical indexed site.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public application MUST be available at the canonical origin
  `https://kamacafe.lupesko.com`.
- **FR-002**: Production hosting MUST serve the generated static site directly
  from a managed edge platform without a separate public origin, application
  server, or request-time application compute.
- **FR-003**: The custom hostname MUST have managed DNS and TLS, and plain HTTP
  requests MUST resolve to the canonical HTTPS origin.
- **FR-004**: A release candidate MUST contain the complete built application,
  static assets, response-header policy, routing behavior, and release identity
  as one immutable version.
- **FR-005**: Candidate creation MUST run the existing catalog, type, unit,
  production-build, and production social-metadata checks before the candidate
  is eligible for promotion.
- **FR-006**: Every eligible candidate MUST expose a unique preview address that
  serves that exact version without receiving production traffic.
- **FR-007**: Preview and provider-development addresses MUST NOT replace the
  canonical production origin in page metadata or be presented to search engines
  as the canonical site.
- **FR-008**: Production promotion MUST require an explicit human approval after
  the approver can inspect the source revision, check results, release identifier,
  and version-specific preview.
- **FR-009**: Promotion MUST activate the reviewed immutable version without
  rebuilding or modifying its application assets.
- **FR-010**: A failed, cancelled, expired, or unapproved candidate MUST NOT
  change the active production version.
- **FR-011**: An authorized maintainer MUST be able to restore a known-good prior
  version without rebuilding that version.
- **FR-012**: The entry document MUST revalidate rather than remain stale, while
  content-addressed assets MAY use long-lived immutable browser caching and
  stable image paths MUST use a finite cache lifetime.
- **FR-013**: Release validation MUST verify canonical URLs, HTTPS behavior,
  content types, cache headers, hash-route navigation, the social preview image,
  and the active release identifier at the public hostname.
- **FR-014**: Production credentials MUST remain outside the repository, MUST be
  available only to the protected release process, and MUST be scoped to the
  minimum account and hosting capabilities needed for KamaCafe.
- **FR-015**: Active production automation, validation, documentation, and
  operator checklists MUST remove dependencies on AWS, Amazon S3, Terraform,
  Terraform state, and the legacy Cloudflare-origin rules.
- **FR-016**: The migration MUST preserve all existing application behavior,
  accessibility expectations, public URLs, contribution links, performance
  targets, and site-wide social preview behavior except for the intentional
  canonical hostname change.
- **FR-017**: Operator documentation MUST describe one-time account/domain setup,
  candidate creation, preview review, manual promotion, public verification,
  rollback, credential rotation, and retirement of the obsolete deployment path.

### Key Entities

- **Release Candidate**: An immutable combination of built application assets,
  hosting configuration, source revision, unique release identifier, validation
  results, and version-specific preview address that is not yet receiving
  production traffic.
- **Production Deployment**: The approved mapping from the canonical hostname to
  one exact release candidate, including who approved it and when it became
  active.
- **Canonical Site Origin**: The single public HTTPS origin
  `https://kamacafe.lupesko.com` used by visitors, metadata, and verification.
- **Deployment Credential**: A secret external to the repository whose scope is
  limited to creating, previewing, promoting, and rolling back KamaCafe releases.
- **Rollback Target**: A prior immutable release that passed production checks
  and can be restored without rebuilding.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of production page, asset, canonical, and preview-image
  requests tested during release acceptance use the secure canonical origin.
- **SC-002**: An approver can inspect a unique live candidate and promote that
  exact release to production in no more than 10 minutes after its required
  automated checks finish.
- **SC-003**: 100% of production promotions recorded during acceptance identify
  the same release before and after approval, with no intervening rebuild.
- **SC-004**: A known-good prior release can be restored and verified at the
  canonical hostname in no more than 5 minutes.
- **SC-005**: The active deployment path requires zero AWS resources, zero AWS
  credentials, and zero Terraform state objects.
- **SC-006**: All existing automated catalog, type, unit, build, browser,
  accessibility, media-failure, performance, and social-metadata checks pass
  after the hosting migration.
- **SC-007**: On the agreed mobile production profile, essential guidance is
  usable within 3 seconds on at least 9 of 10 cold visits.
- **SC-008**: A release audit finds no deployment secret in tracked files, build
  artifacts, workflow output, or public page content.

## Assumptions

- The `lupesko.com` authoritative DNS zone will be active in the selected managed
  edge-hosting account before the custom hostname is attached.
- The domain owner authorizes creation of `kamacafe.lupesko.com`; no conflicting
  DNS record or production service currently uses that hostname.
- The existing hash-based routing remains in scope. Path-based application routes,
  server rendering, APIs, databases, and request-time personalization remain out
  of scope.
- Candidate previews may use provider-generated addresses, but only
  `kamacafe.lupesko.com` is canonical and intended for indexing.
- The source-control platform's protected production environment supplies the
  human approval gate and restricts promotion to the intended mainline revision.
- Social platforms maintain caches independently from the hosting platform and
  may still require an explicit re-scrape after a release.
