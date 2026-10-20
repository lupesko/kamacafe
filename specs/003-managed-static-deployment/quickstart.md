# Quickstart: Validate the Managed Static Deployment

Run commands from the repository root. This guide validates the planned feature;
it does not authorize a production promotion by itself.

## Prerequisites

- Node.js 24 and npm
- A Cloudflare account containing an active `lupesko.com` zone
- An existing empty `kamacafe` Worker with Version URLs enabled
- A per-Worker Editor token for recurring deployment
- A protected GitHub `production` environment with a required reviewer
- Wrangler installed through the project's locked development dependencies

## Validate the application and deployment inputs

```bash
nvm use
npm ci
npm run validate:catalog
npm run typecheck
npm test
npm run validate:deployment
VITE_SITE_URL=https://kamacafe.lupesko.com npm run build
npm run validate:social -- --production
npx wrangler deploy --dry-run
```

Expected result:

- All existing application gates pass.
- `dist/index.html` contains only the canonical production origin for public
  page and image metadata.
- `dist/_headers` exists with immutable-asset, stable-image, security, and
  version-host no-index rules.
- Wrangler resolves `dist/` as static assets without a Worker entry point.
- The dry run reports no runtime Worker bundle or legacy AWS dependency.

Run browser and performance checks as required for the release:

```bash
npx playwright install chromium webkit
npm run test:e2e
npm run test:performance
```

## One-time operator bootstrap

1. Add `lupesko.com` to Cloudflare and make the zone Active if it is not already.
2. Enable MFA and ensure the domain owner controls an account recovery path.
3. Confirm `kamacafe.lupesko.com` has no conflicting DNS record.
4. In an interactive Admin session, create an empty Worker named `kamacafe` and
   enable Version URLs. Do not treat the placeholder as a production release.
5. Attach the Custom Domain `kamacafe.lupesko.com` and wait for its generated DNS
   record and certificate to become active.
6. Enable zone-wide **Always Use HTTPS** only if every active `lupesko.com`
   hostname supports it; otherwise create a Single Redirect scoped to KamaCafe.
7. Create a per-Worker Editor API token for CI; do not use a Global API Key or
   retain Worker Admin/Zone Workers Routes Write in CI.
8. In GitHub, create a `candidate` environment restricted to `main`, with no
   reviewer delay. Store `CLOUDFLARE_API_TOKEN` as its environment secret and
   `CLOUDFLARE_ACCOUNT_ID` as an environment variable.
9. Create the protected `production` environment, restrict it to `main`, store
   the same token and account ID under the same names, require a reviewer, and
   prevent self-review when another operator is available.

Record identifiers and redacted setup evidence in
`specs/001-kamacafe-baseline/deployment-validation.md`. Never record the token.

## Create and inspect a candidate

Manually trigger the workflow from the intended `main` revision. Before
approval, verify its summary contains:

- the exact source commit SHA;
- successful release gates;
- one Worker version ID;
- one unique version URL;
- the canonical production origin used at build time.

Open the version URL and check the home, category, drink, unavailable, image,
and contribution flows. Inspect the initial HTML and verify canonical and social
URLs point to `https://kamacafe.lupesko.com`, not the version URL. Confirm the
version response includes `X-Robots-Tag: noindex`.

## Promote the exact candidate

Approve the waiting `production` job only after reviewing the version URL and
workflow summary. The job must deploy the captured version ID at 100% traffic
without rebuilding.

Confirm the public contract:

```bash
curl --fail --silent --show-error --head https://kamacafe.lupesko.com/
curl --fail --silent --show-error --head https://kamacafe.lupesko.com/images/social-preview.png
```

Then verify:

- HTTP redirects to the equivalent HTTPS path and query.
- `/`, `/#category-espresso-drink`, and `/#espresso` load and survive refresh.
- Browser Back/Forward remains synchronized.
- A nonexistent real path returns 404.
- HTML, hashed assets, and stable images use the expected cache headers.
- The social preview image is `image/png`, 1200×630, and publicly readable.
- The active deployment version equals the reviewed candidate version.

Complete the real-phone, ten-run performance, Safari keyboard, VoiceOver, and
social-inspector checks in
`specs/001-kamacafe-baseline/production-smoke.md`.

## Roll back

Select an explicit known-good version ID from deployment history. From an
authorized environment, run the documented rollback operation or select that
version in the Cloudflare dashboard. Record source and target version IDs and
the reason, then repeat the public smoke checks. The target must not be rebuilt.
