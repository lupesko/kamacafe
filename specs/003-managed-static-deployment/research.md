# Research: Managed Static Deployment

## Cloudflare Workers Static Assets without a Worker script

**Decision**: Deploy Vite's existing `dist/` directory through Workers Static
Assets with no `main` entry point, asset binding, or `run_worker_first` setting.

**Rationale**: Static assets are served without invoking Worker code, static
asset requests are free and unlimited, and the deployed version captures the
asset collection and configuration. KamaCafe has no API, server rendering, or
request-time personalization.

**Alternatives considered**:

- A Worker script that forwards to an asset binding adds runtime code, request
  accounting, and failure modes without user value.
- Cloudflare Pages is viable but does not improve this design over the unified
  Workers version/deployment model selected for manual promotion.
- The existing S3 website origin requires AWS IAM, Terraform state, a public
  origin, and an HTTP edge-to-origin hop.

**Sources**: [Static Assets](https://developers.cloudflare.com/workers/static-assets/),
[billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

## Routing behavior

**Decision**: Set `assets.not_found_handling` to `none`. Preserve the existing
browser hash routes and allow missing real paths to return 404.

**Rationale**: URL fragments are not sent in HTTP requests. `/`,
`/#category-espresso-drink`, and `/#espresso` all request the same `/` asset, so
the existing client router works without fallback. Returning `index.html` for
arbitrary paths would obscure missing-file and typo failures.

**Alternative considered**: `single-page-application` fallback would be
appropriate after a deliberate migration to path routing, but is unnecessary
for hash routing.

**Source**: [Static asset SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)

## Project and custom-domain configuration

**Decision**: Treat `wrangler.jsonc` as the source of truth for the Worker name,
compatibility date, `dist/` asset directory, `not_found_handling: "none"`,
enabled version URLs, disabled stable `workers.dev` route, and intended Custom
Domain. During one-time bootstrap, an operator with account-level Worker Admin
creates the empty `kamacafe` Worker, enables Version URLs, attaches
`kamacafe.lupesko.com`, and waits for its DNS record and certificate. CI begins
only after that bootstrap and uses narrower per-Worker Editor access.

**Rationale**: A project's first upload cannot use `wrangler versions upload`,
and version upload does not apply route/domain trigger changes. Explicit human
bootstrap keeps elevated create/domain permissions out of recurring CI while
letting every real application release use upload, preview, and promotion.

**Alternatives considered**:

- A one-time `wrangler deploy` of the real site would couple its first upload
  and production activation, violating preview-before-promotion.
- Automating the domain with the experimental trigger command makes bootstrap
  harder to reason about and adds no recurring benefit.
- Leaving the stable `workers.dev` route enabled creates an unnecessary second
  public copy of the site.

**Sources**: [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/),
[deployment management](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/)

## HTTPS enforcement

**Decision**: Require the operator to enable Cloudflare's zone-wide **Always Use
HTTPS** setting after confirming every active `lupesko.com` hostname supports
HTTPS. If that zone-wide decision is not acceptable, create one hostname-scoped
Single Redirect for `kamacafe.lupesko.com` instead. Verify path and query
preservation in every release smoke test.

**Rationale**: A Custom Domain provisions TLS but does not itself document an
HTTP redirect. Cloudflare recommends edge redirect enforcement; the static
asset service should not gain a Worker script merely to redirect requests.

**Alternative considered**: A `_redirects` path rule cannot safely distinguish
HTTP from HTTPS and risks a redirect loop.

**Sources**: [Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/),
[Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/)

## Cache and security headers

**Decision**: Add `public/_headers`, which Vite copies into `dist/`. Leave `/`
and HTML on the platform's revalidation default, give `/assets/*` a one-year
immutable browser TTL, give `/images/*` a one-day finite TTL, add conservative
security headers, and send `X-Robots-Tag: noindex` on provider version hosts.

**Rationale**: Workers Static Assets defaults to browser revalidation with an
ETag and supports `_headers` natively. Explicit rules preserve the current
public cache contract while avoiding provider cache rules and purge logic.

**Alternatives considered**:

- Revalidating every asset is correct but gives up the safe repeat-visit benefit
  of Vite's content-addressed assets.
- Setting stable images immutable would make same-path image corrections harder
  to deliver.

**Source**: [Static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/)

## Candidate upload and manual promotion

**Decision**: A manually triggered GitHub workflow checks out an explicit
`main` revision, installs locked dependencies, runs every release gate, builds
once with `VITE_SITE_URL=https://kamacafe.lupesko.com`, and runs
`wrangler versions upload` with the commit SHA as tag and message. Wrangler's
structured output file supplies exactly one version ID and version URL; the job
validates and exposes them as outputs and in its summary. A dependent job using
GitHub's protected `production` environment waits for human approval, verifies
the captured version/tag, and runs
`wrangler versions deploy <version-id>@100% --yes`. It does not rebuild.

**Rationale**: Worker versions include static assets. Separating upload and
deployment makes the reviewed preview and production artifact identical.
Structured output avoids brittle console scraping.

**Alternatives considered**:

- `wrangler deploy` immediately sends a newly created version to 100% traffic.
- Workers Builds automatically deploys on successful builds and omits the chosen
  promotion gate.
- Rebuilding after approval could produce a different artifact.

**Sources**: [Versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/),
[version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/),
[Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/),
[Wrangler output file](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/)

## Authentication and authorization

**Decision**: Keep bootstrap Admin and Zone Workers Routes Write access in a
human interactive session. Give recurring CI one per-Worker Editor token, store
it as `CLOUDFLARE_API_TOKEN`, and store the account ID as non-secret
configuration. Protect `main`; restrict both release environments to `main`;
require a reviewer for `production`; and prevent self-review when another
operator is available.

**Rationale**: Per-Worker Editor is the narrow documented permission for upload,
deploy, and rollback after the service exists. Cloudflare does not separate
upload and deploy permissions, so GitHub approval is an operational workflow
gate rather than an independent Cloudflare authorization boundary. The
unreviewed `candidate` environment is restricted to `main`; the `production`
environment adds human review. Branch and workflow protection are therefore
mandatory.

**Alternatives considered**:

- Global API keys and account-wide recurring Admin tokens are overprivileged.
- Native Git integration removes the token from GitHub but deploys immediately.

**Sources**: [Workers authorization](https://developers.cloudflare.com/workers/authorization/workers/),
[GitHub Actions authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/),
[GitHub environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)

## Rollback

**Decision**: Document `wrangler rollback <version-id> --message ...` and the
dashboard rollback path. Record prior/restored version IDs, approver, time, and
public smoke results. Keep acceptance within the most recent 100 versions.

**Rationale**: Cloudflare can immediately make a prior deployed version active
without rebuilding. This static site has no bound mutable data resource.

**Alternative considered**: Reverting Git and rebuilding is slower and does not
guarantee byte-identical assets.

**Source**: [Workers rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## Platform limits

**Decision**: Use the Workers Free limits unless measured usage requires a paid
plan; validate the build against 20,000 files, 25 MiB per file, 100 header rules,
and 2,000 characters per header-rule line.

**Rationale**: KamaCafe's current artifact is far below those limits, and static
asset requests are not billed as Worker invocations.

**Alternative considered**: Paying before a demonstrated need adds cost without
changing the release design.

**Sources**: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
