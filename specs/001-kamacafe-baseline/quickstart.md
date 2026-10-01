# Phase 1 Quickstart: Validate KamaCafe End to End

This guide describes the runnable checks the implementation must provide. Run
them from the repository root after the implementation tasks are complete.

## Prerequisites

- nvm, Node.js 24 LTS, and npm
- A current Playwright-supported host for Chromium and WebKit
- Terraform 1.x for infrastructure validation
- For deployment only: an AWS account, a Cloudflare-managed zone, a pre-created
  encrypted/versioned S3 Terraform-state bucket, GitHub repository OIDC
  configuration, and a scoped Cloudflare API token

## Install and validate source data

```bash
nvm install
nvm use
npm ci
npx playwright install chromium webkit
npm run validate:catalog
npm run typecheck
```

Expected result: the catalog and ID registry satisfy their schemas; all
references and inherited recipes resolve; required guidance and units are
complete; every drink has an image; TypeScript reports no errors.

## Run focused automated checks

```bash
npm test
```

Expected result: route parsing, recipe inheritance, cycle rejection, stable-ID
rules, and publication validation pass. These tests cover the catalog rules in
[data-model.md](./data-model.md), not presentational implementation details.

## Build and preview production output

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Expected result: Vite creates `dist/`; preview serves the home view at `/` and
all navigation uses the hash contracts in
[contracts/app-contract.md](./contracts/app-contract.md).

## Run browser, accessibility, and media-failure scenarios

With the preview server running:

```bash
npm run test:e2e
```

Expected scenarios:

1. At mobile and desktop sizes, select each category and a drink; verify the
   URL, category order, complete resolved guidance, and back navigation.
2. Open category and drink hashes directly in a fresh context; refresh and use
   Back/Forward without losing URL/view synchronization.
3. Open an unknown category and drink hash; verify the unavailable message and
   home link.
4. Run axe checks on home, category, drink, and unavailable views with no
   WCAG 2.2 A/AA violations.
5. Use keyboard-only navigation and assert visible focus, semantic controls,
   and at least 44 by 44 CSS-pixel effective targets.
6. Block PNG requests and verify ingredients, settings, and steps remain usable.
7. Check 320, 390, 430, 680, and 1440 px widths for wrapping and absence of
   horizontal document overflow.
8. At each required width, open an espresso-derived drink and verify the
   water-guidance label sits above its complete value, both remain inside the
   panel, and compact amount rows retain two-column alignment.

Playwright projects cover Mobile Safari, Mobile Chrome, desktop Chrome, and
desktop WebKit. Before a production release, repeat the main flow manually in
current Safari with keyboard input and VoiceOver.

## Verify the performance budget

```bash
npm run test:performance
```

Expected result: repeated mobile Lighthouse runs score at least 90 for
performance and meet the configured asset budgets. Essential text guidance must
be usable within 3 seconds on the agreed simulated 4G profile. Confirm the
specification's 9-of-10 threshold against the deployed production hostname,
because local CI timing does not include Cloudflare and S3 behavior.

## Validate infrastructure without applying it

```bash
terraform -chdir=infra init -backend=false
terraform -chdir=infra fmt -check
terraform -chdir=infra validate
terraform -chdir=infra plan -var-file=production.tfvars
```

Expected plan: one public-read S3 website bucket named for the site hostname, a
matching proxied Cloudflare CNAME, hostname-scoped Flexible TLS/HTTPS redirect
configuration, cache rules, and least-privilege deployment outputs. The state
file and all credentials remain outside the repository. See
[contracts/deployment-contract.md](./contracts/deployment-contract.md).

## Production smoke test

After the authorized deployment workflow completes:

1. Open the HTTPS custom domain and confirm Cloudflare serves the site.
2. Repeat direct links for `/`, `/#category-espresso-drink`, and `/#espresso`.
3. Verify the response headers revalidate `index.html` and cache static assets
   according to the deployment contract.
4. Complete one espresso-based and one brewed-coffee guide on a real phone.
5. Run ten cold mobile measurements and record whether essential guidance is
   usable within 3 seconds in at least nine runs.

Record the reviewed local plan and production results in
`deployment-validation.md`, and the real-device, performance, Safari, and
VoiceOver results in `production-smoke.md`. Production apply remains blocked
until the actual hostname, AWS region, Cloudflare zone, OIDC provider, and
remote-state inputs replace the placeholders in `infra/production.tfvars.example`.
