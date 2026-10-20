# KamaCafe production infrastructure

Terraform provisions a public, versioned, encrypted S3 website bucket; a least-privilege GitHub Actions deployment role; and hostname-scoped Cloudflare DNS, Flexible SSL, HTTPS redirect, and cache rules.

## Prerequisites

- Terraform 1.10 or newer
- an AWS account and target region
- an existing Cloudflare zone and scoped API token
- an existing AWS IAM OIDC provider for `token.actions.githubusercontent.com`
- a separate pre-created S3 state bucket with encryption, versioning, and native lockfile permissions
- an authorized Terraform bootstrap role; this is separate from the narrow site-object deployment role created here

Copy `production.tfvars.example` to `production.tfvars` and replace every placeholder. That file is ignored. Export `CLOUDFLARE_API_TOKEN`; use AWS OIDC or a short-lived approved AWS session. Never place credentials in Terraform files, plans, state, logs, or GitHub variables.

## Validate and plan

```bash
terraform -chdir=infra fmt -check
terraform -chdir=infra init -backend=false
terraform -chdir=infra validate
terraform -chdir=infra plan -var-file=production.tfvars -out=production.tfplan
```

For collaborative state, initialize with explicit backend values:

```bash
terraform -chdir=infra init \
  -backend-config="bucket=STATE_BUCKET" \
  -backend-config="key=kamacafe/production.tfstate" \
  -backend-config="region=STATE_REGION" \
  -backend-config="encrypt=true" \
  -backend-config="use_lockfile=true"
```

Review the saved plan before applying it. Production apply belongs behind the GitHub `production` environment approval.

## Social metadata deployment

The protected GitHub `SITE_HOSTNAME` variable has two linked uses: Terraform
configures the public hostname, and the application build derives
`VITE_SITE_URL=https://${SITE_HOSTNAME}` from the same value. The build renders
absolute canonical and preview-image URLs into `dist/index.html`, then
`npm run validate:social -- --production` rejects unresolved, insecure, local,
private, reserved, placeholder, or non-origin values before cloud credentials
are configured or any object is uploaded.

The social card is the stable object `/images/social-preview.png`. It is uploaded
with the other images before `index.html` and receives the existing finite image
TTL. The deployment purge includes this path on every release so an updated
card cannot remain stale at Cloudflare. Social networks keep independent caches;
use their preview inspectors or re-scrape controls after origin/CDN validation.

### Legacy production workflow status

The legacy S3 deployment workflow is manual-only while production settings are
being prepared; pushes to `main` run CI without attempting a production deploy.
Before a manual run, configure the `production` environment values listed in
`specs/002-add-social-sharing/tasks.md`. The workflow now reports missing value
names before building and does not print secret values.

The current legacy workflow still creates and applies its Terraform plan in one
run. Do not use that path until a plan-review-before-apply gate is implemented;
see T029 in `specs/002-add-social-sharing/tasks.md`. The in-progress managed
static deployment feature in `specs/003-managed-static-deployment/` is intended
to replace this legacy path with previewed releases and explicit promotion.

## Security and transport

The website bucket is intentionally public-read for objects only. Anonymous listing and writes remain denied. Cloudflare terminates public HTTPS, but the Cloudflare-to-S3 website hop uses HTTP because S3 website endpoints do not support TLS. This is acceptable only while the origin contains public, read-only assets with no accounts, credentials, or personalized traffic.

## Rollback and teardown

S3 versioning supports object rollback. Prefer redeploying a known-good build and purging affected Cloudflare paths. Before any Terraform destroy, retain state and bucket versions, disable the deployment workflow, inspect the exact plan, and obtain explicit production approval; the bucket is not force-destroyed.
