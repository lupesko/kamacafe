# Hosting Contract

## Canonical service

- Public origin: `https://kamacafe.lupesko.com`
- Hosting model: Cloudflare Workers Static Assets with no Worker script
- Deployable directory: `dist/`
- Application routing: browser hash routes; unmatched real paths return 404
- Stable `workers.dev` production route: disabled
- Version URLs: enabled and marked `noindex`

## Custom domain

Cloudflare is authoritative for `lupesko.com`. The Worker Custom Domain owns the
exact hostname `kamacafe.lupesko.com`; Cloudflare creates its proxied DNS record
and edge certificate. No CNAME to an external origin exists.

HTTP requests redirect to their equivalent HTTPS URL while preserving path and
query. The operator enables zone-wide **Always Use HTTPS** only after confirming
every active hostname in the zone supports HTTPS; otherwise the operator uses a
hostname-scoped Single Redirect for KamaCafe.

## Static response behavior

| Request class | Required behavior |
|---|---|
| `/` and `/index.html` | HTML; browser revalidation |
| `/assets/*` | Correct MIME type; one-year immutable browser cache |
| `/images/*` | Correct image MIME type; finite one-day browser cache |
| `/images/social-preview.png` | HTTP 200, `image/png`, 1200×630 |
| Missing real path | 404; do not rewrite to the application shell |
| Hash route | Serve `/`; browser resolves the fragment |
| Version hostname | Same candidate assets, production canonical metadata, `X-Robots-Tag: noindex` |

Security headers must at minimum prevent MIME sniffing and framing and declare a
conservative referrer policy. A content security policy may be added only after
the built application and external contribution links are verified against it.

## Capacity boundaries

While the project uses the Workers Free plan, the release gate rejects an
artifact with more than 20,000 files, any file larger than 25 MiB, more than 100
header rules, or a header-rule line longer than 2,000 characters.

## Prohibited hosting dependencies

The active path must not require AWS, Amazon S3, CloudFront, Terraform, a state
backend, a public object-store origin, runtime Worker code, or an application
server.
