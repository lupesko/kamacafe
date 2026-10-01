# Feature Specification: Social Sharing Metadata

**Feature Branch**: `002-add-social-sharing` *(planning identifier; no Git branch was created)*

**Created**: 2026-10-01

**Status**: Implemented

**Input**: User description: "Add Open Graph tags for social media sharing and plan this as a new feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognizable Shared Link (Priority: P1)

As a coffee enthusiast, I want a KamaCafé link to display a branded title, useful
description, and attractive image when I share it so recipients can recognize the
site and understand why they should open it.

**Why this priority**: A rich, trustworthy preview is the feature's primary user
value; without it, shared links remain generic or inconsistent.

**Independent Test**: Submit the public KamaCafé URL to representative social
preview inspectors and confirm that each preview shows the approved title,
description, and image.

**Acceptance Scenarios**:

1. **Given** the public KamaCafé home URL, **When** a supported social crawler
   reads the page, **Then** it receives a complete website preview with the
   approved KamaCafé title, description, canonical URL, and image.
2. **Given** a public KamaCafé hash-route URL, **When** it is shared, **Then** the
   crawler receives the same site-wide KamaCafé preview rather than a blank,
   generic, or route-specific preview.
3. **Given** a recipient sees the preview, **When** they open the shared link,
   **Then** the existing site remains usable and the sharing metadata does not
   obstruct or delay brewing guidance.

---

### User Story 2 - Consistent Cross-Platform Presentation (Priority: P2)

As a maintainer, I want one approved preview identity to render consistently on
major social platforms so KamaCafé is presented predictably without maintaining
platform-specific content variants.

**Why this priority**: Consistency protects the product identity and keeps the
static site's maintenance burden small.

**Independent Test**: Inspect the published page metadata and compare previews
from at least two Open Graph consumers plus one large-image card consumer.

**Acceptance Scenarios**:

1. **Given** a platform that consumes Open Graph metadata, **When** it inspects
   KamaCafé, **Then** it finds the standard required website fields and the
   recommended descriptive and image fields.
2. **Given** a platform that supports a large-image summary card, **When** it
   inspects KamaCafé, **Then** it can render the same approved title,
   description, and image without a separate content source.
3. **Given** the preview image is cropped or resized by a platform, **When** the
   preview is displayed at a common card size, **Then** the product name and
   essential visual remain legible and recognizable.

---

### User Story 3 - Accessible, Reliable Fallback (Priority: P3)

As a recipient using assistive technology or a client that cannot display the
preview image, I want meaningful text to describe the shared page and image so I
can still understand the link.

**Why this priority**: A visual preview should improve sharing without making the
link less understandable when media is unavailable.

**Independent Test**: Read the published metadata without loading the image and
confirm that the title, description, and image alternative text identify the
site and its purpose.

**Acceptance Scenarios**:

1. **Given** the preview image cannot load, **When** a client reads the metadata,
   **Then** the title and description still explain that KamaCafé provides
   at-home coffee brewing guides.
2. **Given** a client exposes image alternative text, **When** it presents the
   shared preview, **Then** the alternative text describes the image's meaningful
   content rather than repeating a filename or URL.

### Edge Cases

- Social crawlers do not receive URL fragments in page requests, so category and
  drink hash routes cannot provide distinct crawler-visible metadata in the
  current static architecture.
- A missing, relative, non-HTTPS, or placeholder production URL must not reach a
  production release as the canonical preview or image address.
- The preview remains understandable if the image is unavailable or a platform
  crops it differently from the nominal card ratio.
- Social platforms may cache an older preview after a release; verification must
  distinguish cached platform output from incorrect current page metadata.
- Crawlers that do not execute client-side scripts must still receive the full
  metadata in the initial document.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every production entry document MUST expose a site-wide Open Graph
  preview with a title, object type, canonical URL, and image.
- **FR-002**: The preview MUST identify the object as a website named
  "KamaCafé" and use US English locale metadata.
- **FR-003**: The preview title and description MUST accurately reflect the
  visible product identity and its purpose as a guide to brewing coffee at home.
- **FR-004**: The preview MUST include the approved share image's absolute HTTPS
  URL, media type, pixel dimensions, and meaningful alternative text.
- **FR-005**: The approved share image MUST use a landscape social-card ratio,
  remain recognizable when resized or center-cropped, and keep essential text
  within a safe area.
- **FR-006**: The public site URL and share-image URL MUST resolve to the active
  production hostname; a production release MUST reject unresolved placeholders,
  malformed URLs, non-HTTPS URLs, and cross-origin image URLs.
- **FR-007**: The initial page document MUST contain the complete sharing
  metadata without requiring client-side script execution.
- **FR-008**: All current hash-route URLs MUST intentionally use the same
  site-wide preview because social crawlers cannot distinguish fragments in the
  current hosting model.
- **FR-009**: The page MUST expose a compatible large-image summary-card signal
  that reuses the approved Open Graph title, description, and image.
- **FR-010**: Sharing metadata MUST NOT add a runtime service, tracking behavior,
  user data collection, or a script dependency.
- **FR-011**: The existing browser page title, search description, routing,
  accessibility, and brewing-guide behavior MUST remain unchanged except where
  wording is deliberately aligned with the approved social preview copy.
- **FR-012**: Automated release verification MUST confirm the required metadata,
  exact approved copy, absolute secure URLs, image properties, and absence of
  unresolved configuration tokens in the built entry document.
- **FR-013**: Maintainer documentation MUST explain the site-wide preview scope,
  production URL input, local verification procedure, and social-platform cache
  caveat.

### Key Entities

- **Social Preview Metadata**: The site-wide title, description, website type,
  locale, site name, canonical URL, image reference, image properties, and
  large-image card signal published for social crawlers.
- **Share Image**: The branded landscape visual represented by a stable public
  URL, with defined dimensions, media type, alternative text, and crop-safe
  content.
- **Canonical Site URL**: The absolute HTTPS production root used as the stable
  identity for the site-wide preview and as the base for the share-image URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of required Open Graph fields and approved optional fields are
  present and valid in the built production entry document.
- **SC-002**: The production URL produces a preview with the approved title,
  description, and image in at least two Open Graph inspectors and one
  large-image card inspector, allowing for documented platform cache delay.
- **SC-003**: At 1200 by 630 pixels and at representative center-cropped card
  sizes, 100% of the product name and essential illustration remain legible and
  within the visible safe area.
- **SC-004**: Automated verification rejects 100% of tested missing, malformed,
  non-HTTPS, placeholder, and cross-origin production URL cases.
- **SC-005**: The existing mobile performance score remains at least 90 and
  essential brewing guidance remains usable within 3 seconds in the established
  production measurement profile.
- **SC-006**: All existing automated routing, accessibility, catalog, and media
  failure checks continue to pass after the sharing metadata is added.

## Assumptions

- Version one provides one site-wide preview. Per-category and per-drink previews
  are out of scope because hash fragments are not available to social crawlers;
  they would require route or rendering architecture changes.
- The approved copy is "KamaCafé — Brew the perfect cup" with the description
  "Clear guides for brewing the perfect coffee."
- The share image will be a new, dedicated 1200 by 630 pixel asset rather than a
  current square drink illustration.
- The production hostname is supplied by the existing protected deployment
  environment and is not committed as a repository-specific secret or value.
- Open Graph is the primary interoperability contract. A large-image card hint
  is included for platforms that need it, while platform-specific accounts,
  analytics, and share buttons remain out of scope.
