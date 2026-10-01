# KamaCafe

KamaCafe is a mobile-first, catalog-driven guide for making coffee. It is a static Preact application: `catalog.json` supplies every category and recipe, while browser hash routes make each guide shareable.

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
- `infra/`: Terraform for S3, Cloudflare, and GitHub OIDC deployment

## Deployment

Pull requests run the complete validation pipeline. The protected production workflow builds once, strictly validates social metadata, applies reviewed Terraform, uploads stable images before `index.html`, and purges changed image paths plus the social preview path. Production inputs and credentials are configured outside the repository; see `infra/README.md`.

## Contribute

Use [GitHub issues](https://github.com/lupesko/kamacafe/issues) to report a problem. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a recipe or code change.
