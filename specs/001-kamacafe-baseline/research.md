# Phase 0 Research: KamaCafe Baseline

## Client application stack

**Decision**: Use Vite 8, Preact 10, and strict TypeScript on Node.js 24 LTS.

**Rationale**: Vite produces static assets suitable for S3 and supports Preact
and TypeScript directly. Preact supplies a compact, familiar component model
for the four view states without requiring a full application framework. The
selected Node release is an LTS build-time dependency only; no Node process is
needed in production.

**Alternatives considered**: React 19 had the largest contributor ecosystem but
more runtime and tooling than this app needs. Svelte 5 was concise but adds a
less familiar component dialect. Vanilla TypeScript minimized dependencies but
would require hand-built rendering and update mechanics. SSR frameworks were
excluded by the product constraint.

## Navigation

**Decision**: Parse `window.location.hash` directly and listen for `hashchange`;
render `/` for an empty hash, `/#category-{id}` for categories, and `/#{id}` for
drinks. Use real anchor elements so browser Back/Forward behavior is native.

**Rationale**: The complete route grammar has only two hash forms. A routing
dependency would duplicate browser behavior and increase the bundle without a
user benefit. Hash routing also allows every deep link and refresh to request
the same S3 object.

**Alternatives considered**: A client router was rejected because nested
routes, loaders, and route guards are absent. Path routing was rejected because
it requires S3/edge fallback configuration and conflicts with the specified
URLs.

## Catalog loading and publication validation

**Decision**: Import the root `catalog.json` at build time, validate it before
build with JSON Schema plus semantic TypeScript checks, and fail publication on
any error. Maintain `catalog-id-registry.json` as an append-only registry of
active and retired category/drink IDs.

**Rationale**: Build-time import keeps rendering synchronous and makes the
published bundle correspond exactly to the validated catalog revision. JSON
Schema detects shape and type drift; semantic checks cover uniqueness,
references, cycles, inherited completeness, range ordering, units, milk
temperature, and matching images. The registry gives reviewers a durable way
to prevent a retired ID from being reassigned while still allowing display
names to change.

**Alternatives considered**: Runtime fetch would add loading and failure states
without enabling independent content deployment. Schema-only validation cannot
check graph resolution or file existence. Comparing names across git revisions
would incorrectly reject legitimate renames and cannot reliably identify
reassignment.

## Reusable recipe resolution

**Decision**: Resolve `baseRecipeId` recursively with a visited-ID set. Ancestor
ingredients and steps precede local ingredients and steps; inherited scalar
settings are used when the local recipe omits them. Preserve source order and
source wording, then renumber the combined steps for display.

**Rationale**: The rule is deterministic, handles future inheritance depth,
surfaces complete guidance, and can be validated independently of the UI.
Duplicate ingredients or similar step wording remain visible because silently
merging or rewriting recipe content would invent editorial rules.

**Alternatives considered**: Resolving only one level would fail future nested
recipes. Parsing prose such as “Prepare the Espresso recipe” was rejected as
fragile. Mutating the source objects was rejected because it obscures the
catalog contract.

## Visual implementation

**Decision**: Use semantic Preact markup and plain CSS with custom properties
for the Cocoa design tokens. Use CSS Grid/Flexbox breakpoints at 680 px and a
760 px reading column. Keep all required guidance as text and mark drink images
decorative within already-labelled controls.

**Rationale**: The visual specification is narrow and fully described. Plain
CSS implements it with no design-system dependency, while semantic HTML keeps
keyboard and assistive-technology behavior understandable.

**Alternatives considered**: Material component libraries were rejected because
they would add weight and require overrides to match the Cocoa design. CSS-in-JS
was rejected because the design is static and global tokens are sufficient.

## Browser and automated verification policy

**Decision**: Support current and previous two major iOS Safari releases,
current Android Chrome, and latest desktop Chrome and Safari. Run Vitest domain
tests and Playwright projects for Mobile Safari, Mobile Chrome, desktop Chrome,
and desktop WebKit. Run axe on every view and Lighthouse CI with repeated mobile
runs and explicit performance budgets. Perform a short real-Safari keyboard and
VoiceOver release check.

**Rationale**: Chromium plus WebKit covers the engines and devices most relevant
to the agreed audience. Playwright device profiles supply consistent touch,
viewport, and user-agent emulation. Automated accessibility checks catch common
WCAG failures, while the manual pass covers behavior automation cannot judge.
Repeated Lighthouse measurements reduce noise around the 3-second goal.

**Alternatives considered**: Testing every desktop engine on every pull request
would add time without matching the agreed priorities. JSDOM-only component
tests would miss layout, navigation history, image failure, focus, and browser
differences. A single Lighthouse run was rejected as too noisy for a gate.

## Static hosting and TLS

**Decision**: Publish to a public-read S3 bucket named exactly for the site
hostname, enable S3 website hosting, and create a proxied Cloudflare CNAME to
the regional S3 website endpoint. Use Cloudflare Universal SSL, an HTTP-to-HTTPS
redirect, and hostname-scoped Flexible origin encryption.

**Rationale**: This is the smallest design that satisfies S3 hosting, a custom
domain, browser HTTPS, and the explicit choice to avoid CloudFront and
Cloudflare Cloud Connector. The app contains only public static files and no
accounts or sensitive requests. Hash routing means S3 only needs to serve the
root document and asset paths.

**Alternatives considered**: Cloudflare Cloud Connector automates origin
routing but is beta and adds another rules feature. A Worker proxy adds code and
a deployed runtime. CloudFront provides private-origin TLS but was explicitly
excluded. DNS-only S3 hosting cannot provide HTTPS. The accepted limitation is
that Cloudflare-to-S3 traffic uses HTTP because S3 website endpoints do not
support TLS.

## Infrastructure and deployment

**Decision**: Use Terraform with the AWS and Cloudflare providers, remote
encrypted/versioned S3 state with native lockfiles, and GitHub Actions. GitHub
assumes a least-privilege AWS role through OIDC; Cloudflare uses a scoped API
token stored as an Actions secret. Deploy immutable Vite assets with long cache
headers, keep `index.html` revalidating, and purge changed stable image paths.

**Rationale**: Terraform manages both providers with one reviewable plan and
Cloudflare publishes first-party provider guidance. OIDC avoids long-lived AWS
keys. Remote locked state supports reproducible collaboration without checking
state into git.

**Alternatives considered**: AWS CDK is awkward for Cloudflare resources.
Pulumi would introduce its runtime and state workflow. OpenTofu is viable, but
Terraform has the clearest Cloudflare examples for this small project. A fully
uncached site would waste the edge cache; caching `index.html` for a long period
would delay releases.
