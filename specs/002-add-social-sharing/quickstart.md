# Quickstart: Validate Social Sharing Metadata

## Prerequisites

- Node.js 24 and npm
- Playwright-supported Chromium and WebKit hosts
- The canonical production origin `https://kamacafe.lupesko.com`

## Local build and automated checks

Copy the documented non-production values, install dependencies, and run the
full validation path:

```bash
cp .env.example .env.local
npm ci
npm run build
npm run validate:social
npm run typecheck
npm test
npm run test:e2e
npm run test:performance
```

Expected results:

- The build emits `dist/index.html` with no `%VITE_*%` token.
- The browser and Open Graph descriptions are exactly
  `Clear guides for brewing the perfect coffee.`
- Generic social validation reports one valid site-wide metadata object and a
  1200×630 PNG.
- Unit tests reject the missing, duplicate, malformed, insecure, placeholder,
  cross-origin, wrong-copy, wrong-path, wrong-format, and wrong-dimension cases.
- Playwright confirms the initial HTML contains the metadata without JavaScript
  and that `/` and `/#latte` expose the same canonical social object.
- Existing catalog, routing, accessibility, media-failure, and performance gates
  remain green.

Inspect the rendered contract when debugging:

```bash
rg -n 'canonical|og:|twitter:' dist/index.html
npm run validate:social
```

## Failure checks

Each command below MUST exit nonzero:

```bash
VITE_SITE_URL=http://coffee.example.com npm run build
VITE_SITE_URL=https://example.com npm run build
VITE_SITE_URL=https://coffee.example.com/path npm run build
```

The `.test` fixture is permitted by generic validation but MUST fail strict
production validation:

```bash
VITE_SITE_URL=https://preview.kamacafe.test npm run build
npm run validate:social -- --production
```

## Production artifact check

Build with the actual hostname supplied by the protected environment, then run
the strict gate:

```bash
VITE_SITE_URL="https://kamacafe.lupesko.com" npm run build
npm run validate:social -- --production
npm run validate:deployment
```

Strict validation occurs before any immutable Worker version upload. Candidate
review and promotion follow `specs/003-managed-static-deployment/quickstart.md`.

## Post-deploy smoke

For the deployed root URL:

1. Fetch the HTTPS document without executing JavaScript and confirm the exact
   fields in [the social preview contract](./contracts/social-preview-contract.md).
2. Fetch `/images/social-preview.png`; confirm HTTP 200, `image/png`, and the
   expected stable-image cache policy.
3. Open a representative drink hash URL and confirm browser navigation still
   reaches that guide; expect the same site-wide preview metadata as `/`.
4. Submit the root URL to two Open Graph inspectors and one current large-image
   card inspector. Record the tool, timestamp, deployed revision, title,
   description, image, and any explicit cache refresh.
5. If a platform remains stale, first verify the origin and Cloudflare response,
   then request a platform re-scrape. Treat platform cache delay separately from
   deployment correctness.

Page-specific drink previews are not expected: URL fragments do not reach the
social crawler in the current architecture.

## Implementation validation record

Validated on 2026-10-01:

- `npm ci`, `npm run typecheck`, all 61 unit tests, a production-shaped build,
  generic metadata validation, and strict production validation passed.
- The insecure, example-host, non-root-path, and strict `.test` failure checks
  all exited nonzero as required.
- All 12 response-level social-sharing checks passed across the four configured
  Playwright projects. They verify initial HTML, hash-route consistency, the
  complete recommended field set, alt-text parity, and image response type.
- The complete browser-backed Playwright suite and Lighthouse health check were
  invoked, but this local macOS runner denied the browsers' Mach service
  registration (`bootstrap_check_in ... Permission denied (1100)`) before a
  page could launch. This is a host restriction rather than an application test
  failure. The unchanged Ubuntu CI gates still install supported Chromium and
  WebKit builds and run both complete commands; no assertion or threshold was
  disabled.
- The local shell used Node.js 25.4.0 and reported the expected engine warning
  because the repository and CI intentionally pin Node.js 24 via `.nvmrc`.

Production-origin/CDN checks and the three platform inspectors remain a
post-deploy operation because no production deployment was performed as part of
this implementation.
