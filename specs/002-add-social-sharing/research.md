# Research: Social Sharing Metadata

## Static crawler-visible metadata

**Decision**: Put the complete social metadata block in the initial `index.html`
head and verify the built response. Do not manage metadata from Preact.

**Rationale**: Social crawlers are not guaranteed to execute JavaScript. Static
head metadata is the smallest approach and works with the existing S3-hosted
entry document. It also adds no runtime script or network request.

**Alternatives considered**:

- Client-side head updates: rejected because crawlers may only inspect the
  response HTML and because it cannot solve fragment routing.
- Static prerendering or SSR: rejected as disproportionate for one site-wide
  preview and incompatible with the current no-server constraint.

**Sources**: [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[Google special tags guidance](https://developers.google.com/search/docs/crawling-indexing/special-tags)

## Open Graph and large-image card fields

**Decision**: Publish `og:title`, `og:type=website`, `og:image`, and `og:url`,
plus `og:description`, `og:site_name`, `og:locale=en_US`, and structured image
type, width, height, and alt fields. Add `twitter:card=summary_large_image` and
`twitter:image:alt`; allow the card consumer to reuse Open Graph title,
description, and image values.

**Rationale**: The first four fields are the Open Graph basic metadata contract.
The additional fields improve descriptive, localization, sizing, and accessible
rendering. Reusing one source avoids platform-specific copy drift.

**Alternatives considered**:

- Duplicate X title, description, and image fields: rejected because documented
  Open Graph fallback already supplies them and duplicates add drift risk.
- `og:image:secure_url`: rejected as redundant because the primary image URL is
  already HTTPS.
- Social account/creator fields: rejected because no approved account is part of
  this feature.

**Sources**: [The Open Graph protocol](https://ogp.me/),
[X image alt support](https://blog.x.com/developer/en_us/a/2016/alt-text-support-for-twitter-cards-and-the-rest-api)

## One site-wide object for hash routes

**Decision**: Use the fragment-free production root as `og:url` and expose the
same metadata for home, category, drink, and unavailable hash routes.

**Rationale**: A URL fragment is separated before dereferencing and handled by
the user agent. The crawler fetches `/` for every current route, so route-specific
metadata is not observable at the origin.

**Alternatives considered**:

- Update tags in response to `hashchange`: rejected because the crawler never
  receives or runs the route-specific state reliably.
- Distinct drink previews: deferred until the product adopts path routes plus
  static prerendered HTML, separate documents, or server rendering.

**Source**: [RFC 3986 section 3.5](https://www.rfc-editor.org/rfc/rfc3986.html#section-3.5)

## Preview image

**Decision**: Add `public/images/social-preview.png`, a dedicated 1200×630 PNG
using the Cocoa palette, KamaCafé name/tagline, bean identity, and coffee imagery.
Keep essential content inside a centered safe area and target no more than 1 MB.

**Rationale**: A 1.91:1 landscape image is a widely supported compromise for
Open Graph and large-image cards. A dedicated composition is more legible than
stretching or cropping the existing square drink assets. PNG matches the current
asset pipeline and is conservatively supported.

**Alternatives considered**:

- Reuse a 1254×1254 drink image: rejected because a center crop loses context
  and provides no product identity.
- SVG or animated media: rejected for inconsistent card support and unnecessary
  complexity.
- Content-hashed filename: rejected because the deployment already has a stable
  image cache/purge path and metadata needs a deterministic public URL.

**Source**: [LinkedIn link thumbnail guidance](https://www.linkedin.com/help/linkedin/answer/a525301/sharing-articles-or-links)

## Build-time URL substitution

**Decision**: Use Vite's `%VITE_SITE_URL%` HTML replacement for the canonical
root and image URL. Require the variable for every build. Use
`https://preview.kamacafe.test` in local/CI test builds and
`https://${SITE_HOSTNAME}` in the protected deployment build.

**Rationale**: The public hostname already belongs to deployment configuration,
not source code. Native HTML replacement keeps the metadata static and avoids a
custom runtime. A post-build check is required because Vite warns but can leave
an unknown placeholder unreplaced.

**Alternatives considered**:

- Hard-code the production hostname: rejected because the repository treats it
  as deployment configuration and the value is not defined in source.
- Add a Vite head/plugin abstraction: rejected because one placeholder and one
  validator are easier to inspect; rendered-output validation is still needed.
- Fetch or resolve DNS during build: rejected because it makes builds dependent
  on network state and does not prove the later deployed artifact is reachable.

**Sources**: [Vite HTML constant replacement](https://vite.dev/guide/env-and-mode#html-constant-replacement),
[Vite index.html behavior](https://v8.vite.dev/guide/#index-html-and-project-root)

## Validation and release gating

**Decision**: Implement `scripts/validate-social-metadata.ts` with Node built-ins.
Generic mode permits the explicit HTTPS `.test` fixture. Production mode rejects
local/reserved/example/private/placeholder hosts. Both modes validate exact tag
cardinality and copy, URL structure, same-origin image path, unresolved tokens,
PNG signature, and actual 1200×630 IHDR dimensions. Run generic validation after
every build and strict validation before production upload.

**Rationale**: Checking rendered `dist/index.html` catches missing replacement,
typos, duplicate tags, and copy drift that configuration validation alone cannot.
Reading the PNG header avoids a new image library. Deployment remains fail-closed
before credentials are used or objects are uploaded.

**Alternatives considered**:

- Validate source HTML only: rejected because it cannot prove replacement.
- Rely only on social platform debuggers: rejected because they are manual,
  cached, and run too late to protect deployment.
- Add an HTML parser/image package: rejected because the contract is small and
  Node built-ins are sufficient.

## Cache and production verification

**Decision**: Upload the share image through the existing stable `/images`
pipeline before `index.html`, purge its Cloudflare path when changed, and use
post-deploy inspectors to refresh and verify platform caches.

**Rationale**: The current workflow already provides the correct ordering,
content type handling, and finite cache policy. Origin/CDN correctness and social
platform cache freshness are separate checks.

**Alternatives considered**:

- Add new Terraform resources or cache rules: rejected because `/images` is
  already covered.
- Treat a stale platform preview as a deployment failure: rejected because
  platform caches are externally controlled and may update asynchronously.

**Sources**: [LinkedIn Post Inspector cache behavior](https://www.linkedin.com/help/linkedin/answer/a6233775),
[Meta Sharing Debugger](https://developers.facebook.com/tools/debug/sharing/),
[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
