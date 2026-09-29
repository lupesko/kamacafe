# Deployment Contract

## Inputs

Terraform accepts non-secret variables for:

- `site_hostname`: canonical public hostname and exact S3 bucket name.
- `aws_region`: region containing the website and Terraform-state buckets.
- `cloudflare_zone_id`: existing Cloudflare zone identifier.
- `github_repository`: `owner/repository` allowed to assume the deployment role.
- Cache lifetimes and common resource tags.

Credentials are supplied only through environment/CI identity. Terraform files,
variable files, plans, state, and application bundles must not contain AWS keys
or the Cloudflare API token.

## Provisioned resources

### Amazon S3

- One bucket named exactly `site_hostname`.
- Static website index document `index.html` and an error document that gives a
  usable route back to the app.
- Public `s3:GetObject` for deployed site objects; listing and writes remain
  denied to anonymous users.
- Block Public Access adjusted only as required for the website policy.
- Versioning enabled for recoverable deployments.
- Ownership controls and encryption at rest enabled.
- A least-privilege GitHub OIDC deployment role that may sync site objects and
  read only the bucket metadata needed for deployment.

The Terraform backend uses a separate pre-created encrypted, versioned S3
bucket with native lockfiles. Website objects and Terraform state never share a
bucket.

### Cloudflare

- One proxied CNAME for `site_hostname` targeting the regional S3 website
  endpoint.
- Universal SSL at the edge and a hostname-scoped HTTP-to-HTTPS redirect.
- Hostname-scoped Flexible origin encryption because the S3 website endpoint
  accepts HTTP only.
- Cache rules that keep `index.html` revalidating and allow longer caching for
  CSS, JavaScript, and image assets.

This design intentionally exposes public objects at the S3 website endpoint and
does not encrypt the Cloudflare-to-S3 hop. It is valid only while the site
contains public read-only content and no credentials, accounts, or personalized
requests.

## Build artifact headers

| Object class | Cache behavior |
|---|---|
| `index.html` and error document | `no-cache`, allowing revalidation on every navigation |
| Vite content-hashed JS/CSS assets | `public, max-age=31536000, immutable` |
| Stable `/images/{id}.png` assets | Finite browser TTL; purge changed paths during deployment |

Content types must be correct for HTML, JavaScript, CSS, JSON, SVG, and PNG.
Deployment uploads immutable assets before `index.html` so the entry document
never points to files that have not arrived.

## Continuous delivery

- Pull requests run catalog validation, type checking, unit tests, production
  build, browser/axe tests, Lighthouse CI, `terraform fmt -check`, and
  `terraform validate`.
- Infrastructure changes produce a reviewable Terraform plan and require the
  repository's protected production environment before apply.
- A successful `main` workflow builds once, uploads that artifact to S3, then
  updates/revalidates the entry document and purges changed stable Cloudflare
  paths.
- AWS authentication uses GitHub OIDC. Cloudflare access uses the minimum API
  token permissions for DNS/rules/cache operations and is stored as a protected
  Actions secret.

## Required outputs

Terraform exposes the S3 website endpoint, canonical HTTPS URL, bucket name,
and deployment role ARN. Outputs must not contain secret values.
