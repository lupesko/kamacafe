# KamaCafe

KamaCafe is a mobile-first, catalog-driven guide for making coffee. It is a static Preact application: `catalog.json` supplies every category and recipe, while browser hash routes make each guide shareable.
KamaCafe was built with GitHub's [SpecKit]([url](https://github.com/github/spec-kit)) SDD (Spec Driven Development) and OpenAI Codex.

## Run locally

Prerequisites: nvm, Node.js 24, npm, and current Playwright-supported Chromium/WebKit hosts.

```bash
nvm install
nvm use
npm ci
cp .env.example .env.local
npx playwright install chromium webkit
npm run validate:catalog
npm run typecheck
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Open http://127.0.0.1:4173. In another terminal, use `npm run test:e2e` for browser and accessibility checks or `npm run test:performance` for Lighthouse budgets.

The checked-in `.env.example` supplies the non-production social-preview origin
and shows the optional public-project link overrides. Copy it to `.env.local`
before a local production build. `VITE_SITE_URL` must be an absolute HTTPS
origin; the protected deployment replaces the `.test` fixture with the real
site hostname.

## Social previews

KamaCafe publishes one static Open Graph preview for the whole site. Browser
hash routes such as `/#latte` remain shareable links, but fragments are not sent
to social crawlers, so every route intentionally uses the same site-wide title,
description, canonical URL, and `public/images/social-preview.png` image.

`npm run build` validates the rendered metadata and 1200×630 PNG. You can rerun
that check with `npm run validate:social`; production uses
`npm run validate:social -- --production` to reject local, reserved, private,
or placeholder hostnames. After changing copy or the preview image, verify the
deployed URL in social-platform inspectors. Those platforms maintain caches
separately from Cloudflare and may require an explicit re-scrape.

## Project structure

- `catalog.json` and `catalog-id-registry.json`: published content and permanent IDs
- `src/catalog/`: validation, lookup, and recipe inheritance
- `src/routing/`: native hash URL state
- `src/components/` and `src/views/`: semantic Preact interface
- `public/images/`: deployable drink illustrations and the social preview image
- `tests/`: Vitest, Playwright/axe, and Lighthouse checks
- `wrangler.jsonc`: assets-only Cloudflare Worker configuration
- `public/_headers`: browser cache, security, and preview-indexing policy
- `scripts/`: catalog, metadata, deployment, and production verification gates

## Deployment

Pull requests run the complete validation pipeline, including a Wrangler dry
run. Production is served directly from Cloudflare Workers Static Assets at
`https://kamacafe.lupesko.com`; there is no AWS account, S3 origin, Terraform
state, or request-time Worker code.

The manual release workflow builds and validates one immutable candidate, then
uploads it without changing production. Its unique Version URL is shown in the
workflow summary. A maintainer reviews that URL and approves the protected
`production` environment; the second job promotes the captured version ID at
100% without rebuilding. See
[`specs/003-managed-static-deployment/quickstart.md`](specs/003-managed-static-deployment/quickstart.md)
for one-time domain setup, release verification, and rollback instructions.

Rollback is a separate, reviewer-gated workflow. Supply an explicit known-good
version ID and a short reason; the workflow records the current version,
restores the target without rebuilding, and repeats public verification. Direct
rollback is limited to Cloudflare's 100 most recent published versions.

Rotate the per-Worker token by creating its replacement, updating the protected
GitHub secret, validating a candidate, and then revoking the old token. Removing
the Worker or Custom Domain is destructive: first retain the intended release
IDs and DNS ownership evidence, disable the release workflows, and confirm no
production traffic depends on the hostname. Platform version changes do not
clear browser or social-network caches; use finite stable-image caching and
platform re-scrape controls where needed.

Validate a production-shaped artifact locally without contacting Cloudflare:

```bash
VITE_SITE_URL=https://kamacafe.lupesko.com npm run build
npm run validate:social -- --production
npm run validate:deployment
WRANGLER_LOG_PATH=/tmp/kamacafe-wrangler.log npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

## Contribute

Use [GitHub issues](https://github.com/lupesko/kamacafe/issues) to report a problem. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a recipe or code change.
