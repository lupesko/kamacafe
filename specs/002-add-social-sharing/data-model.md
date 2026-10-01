# Data Model: Social Sharing Metadata

This feature adds no persisted runtime data. Its model is a build-time contract
between source metadata, deployment configuration, the built entry document,
and one static image.

## Social Preview Metadata

| Field | Value/source | Validation |
|---|---|---|
| Browser title | `KamaCafé — Brew the perfect cup` | Present once and aligned with social title |
| Search description | `Clear guides for brewing the perfect coffee.` | Present once and aligned with social description |
| Open Graph type | `website` | Exactly one |
| Open Graph locale | `en_US` | Exactly one |
| Open Graph site name | `KamaCafé` | Exactly one |
| Open Graph title | Approved browser title | Exactly one, exact copy |
| Open Graph description | Approved search description | Exactly one, exact copy |
| Open Graph URL | Canonical site root | Absolute HTTPS, origin root, no query/fragment |
| Open Graph image | Canonical site root + `/images/social-preview.png` | Absolute HTTPS, same origin, exact path |
| Image type | `image/png` | Matches actual file format |
| Image width | `1200` | Matches PNG IHDR width |
| Image height | `630` | Matches PNG IHDR height |
| Image alt | Approved meaningful description | Non-empty and not a filename/URL |
| Large-image card | `summary_large_image` | Exactly one |
| Card image alt | Same as Open Graph image alt | Exact match |

### Relationships

- The canonical root derives from one `VITE_SITE_URL` build input.
- The canonical URL and preview image share the same origin.
- The image metadata describes exactly one deployed `Share Image`.
- All hash routes resolve to the same metadata object.

## Canonical Site URL

| Attribute | Rule |
|---|---|
| Source | Explicit `VITE_SITE_URL` build variable |
| Form | URL origin only; no path beyond `/`, credentials, query, or fragment |
| Scheme | HTTPS in all builds; no implicit scheme |
| Trailing slash | Input is normalized or required without one; emitted canonical URL has `/` |
| Generic validation | Explicit `.test` fixture may be used for local and CI builds |
| Production validation | Reject localhost, loopback, private, reserved/example, and obvious placeholder hostnames |

## Share Image

| Attribute | Rule |
|---|---|
| Source path | `public/images/social-preview.png` |
| Built path | `dist/images/social-preview.png` |
| Public path | `/images/social-preview.png` |
| Format | Non-animated PNG |
| Dimensions | Exactly 1200×630 pixels |
| Size target | At most 1 MB |
| Identity | Cocoa palette, KamaCafé name/tagline, bean identity, coffee imagery |
| Safe area | Product name and essential illustration remain legible in expected centered landscape crops |
| Accessibility | Meaningful alt text supplied in both Open Graph and card metadata |

## Validation States

```text
source metadata + VITE_SITE_URL + PNG
                  │
                  ▼
             Vite build
                  │
                  ▼
       generic rendered-output check
            │ pass       │ fail
            ▼            └─ stop build
   deploy workflow only
            │
            ▼
       strict production check
            │ pass       │ fail
            ▼            └─ stop before upload
  upload image, then index.html
            │
            ▼
 origin/CDN smoke + platform inspectors
```

There is no mutable lifecycle after deployment. A content or hostname change
creates a new build, repeats both validation gates, and replaces the stable
published objects through the existing deployment process.
