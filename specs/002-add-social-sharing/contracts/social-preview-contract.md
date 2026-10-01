# Social Preview Contract

## Initial document head

The built `dist/index.html` MUST contain each row exactly once before the module
script. `SITE_ROOT` is the validated build-time origin followed by `/`;
`IMAGE_URL` is the same origin followed by `/images/social-preview.png`.

| Element/property | Required value |
|---|---|
| `title` | `KamaCafé — Brew the perfect cup` |
| `meta[name="description"]` | `Clear guides for brewing the perfect coffee.` |
| `link[rel="canonical"]` | `SITE_ROOT` |
| `og:type` | `website` |
| `og:locale` | `en_US` |
| `og:site_name` | `KamaCafé` |
| `og:title` | `KamaCafé — Brew the perfect cup` |
| `og:description` | `Clear guides for brewing the perfect coffee.` |
| `og:url` | `SITE_ROOT` |
| `og:image` | `IMAGE_URL` |
| `og:image:type` | `image/png` |
| `og:image:width` | `1200` |
| `og:image:height` | `630` |
| `og:image:alt` | `KamaCafé coffee brewing guides with illustrated coffee drinks` |
| `twitter:card` | `summary_large_image` |
| `twitter:image:alt` | Same as `og:image:alt` |

The source HTML uses `%VITE_SITE_URL%/` for `SITE_ROOT` and
`%VITE_SITE_URL%/images/social-preview.png` for `IMAGE_URL`. No unresolved
`%VITE_*%` token may remain in built output. Since card consumers can fall back
to Open Graph values, separate card title, description, and image tags are not
required and MUST NOT become a second content source.

## URL rules

- `VITE_SITE_URL` is required for `vite build` and represents an origin, not a
  page path.
- All builds require an explicit absolute HTTPS value with no credentials,
  non-root path, query, or fragment.
- Generic validation permits only the documented `.test` fixture exception for
  non-production builds; it does not permit missing or malformed values.
- `--production` validation additionally rejects localhost, loopback, private,
  reserved/example, and obvious placeholder hostnames.
- The canonical and image URLs use the same origin. `og:url` never contains a
  hash route.
- Build validation does not perform DNS or HTTP requests.

## Image rules

- `public/images/social-preview.png` MUST be a valid PNG whose IHDR reports
  exactly 1200×630 pixels.
- The final file SHOULD be at most 1 MB.
- The Cocoa palette, product name/tagline, bean mark, and essential coffee
  imagery MUST remain recognizable in the full frame and expected centered
  landscape crops.
- The metadata alt text describes the image and MUST match across Open Graph and
  card fields.

## Build and deployment gates

1. `npm run build` performs the normal catalog/type checks and Vite build, then
   runs generic social metadata validation against `dist`.
2. CI and Playwright supply `VITE_SITE_URL=https://preview.kamacafe.test`.
3. Deployment supplies `VITE_SITE_URL=https://${SITE_HOSTNAME}` from the same
   protected variable used by Terraform.
4. Deployment runs `npm run validate:social -- --production` after the build and
   before cloud credentials or object upload.
5. The existing workflow uploads `dist/images` before `dist/index.html` and
   purges `/images/social-preview.png` when it changes.

Any missing/duplicate/wrong tag, copy mismatch, unresolved placeholder, invalid
URL, origin mismatch, wrong image path/type/dimensions, or strict hostname
failure exits nonzero and prevents release.

## Route behavior

The response body for `/`, `/#category-{id}`, `/#${drinkId}`, and unknown hash
routes exposes the same canonical root and social metadata. Per-route social
objects are not part of this contract.
