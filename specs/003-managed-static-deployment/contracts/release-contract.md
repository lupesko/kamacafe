# Release Contract

## Inputs

### Checked-in, non-secret

- Worker name and static asset configuration
- Canonical hostname `kamacafe.lupesko.com`
- Node and Wrangler dependency versions through the lockfile
- Cache and security header policy
- Source revision and workflow definition

### External configuration

- `CLOUDFLARE_ACCOUNT_ID`: non-secret variable in both release environments
- `CLOUDFLARE_API_TOKEN`: environment secret with per-Worker Editor access
- GitHub `candidate` environment: restricted to `main`, without a reviewer delay
- GitHub `production` environment: restricted to `main`, with required human
  reviewer and prevention of self-review when a second operator is available

Bootstrap Worker Admin and Zone Workers Routes Write permissions remain in an
interactive human session and are not granted to recurring CI.

No credential, token value, session material, or provider response containing a
secret may enter Git, `dist/`, uploaded workflow artifacts, or job summaries.

## Bootstrap boundary

Before CI creates the first real candidate, an operator creates the empty
`kamacafe` Worker, enables Version URLs, and attaches the Custom Domain. This is
required because the first Worker upload cannot use `wrangler versions upload`
and version uploads do not apply trigger/domain changes. The placeholder is not
accepted as the KamaCafe production release.

## Candidate creation

Candidate creation runs manually against one immutable `main` commit and must:

1. Install dependencies from the lockfile.
2. Run catalog validation, type checking, unit tests, deployment-configuration
   validation, and the production build.
3. Build with `VITE_SITE_URL=https://kamacafe.lupesko.com` and the canonical
   repository/contribution URLs.
4. Run strict production social-metadata validation against the completed build.
5. Validate asset count, individual file size, and required `_headers` content.
6. Upload `dist/` once as a new Worker version without deploying it.
7. Parse Wrangler's structured output and require exactly one version-upload
   record containing one version ID and one version URL.
8. Expose the version ID, source revision, and version URL as job outputs and
   show those non-secret values with validation results in the workflow summary.

Any failure stops before upload where possible. An uploaded candidate that later
fails validation is not eligible for promotion.

## Manual promotion

The promotion job must depend on successful candidate creation and reference the
GitHub `production` environment. After approval it must:

1. Accept only the captured candidate version ID from the same workflow run.
2. Verify that the version exists and its tag identifies the expected revision.
3. Deploy that one version at 100% traffic non-interactively.
4. Perform public HTTPS, hash-route, metadata, image, content-type, cache-header,
   and active-version verification.
5. Record the deployment/version ID, revision, approval, canonical URL, and check
   results without recording secrets.

The promotion job must not run the Vite build, mutate `dist/`, upload another
Worker version, or select a newer version by relative position.

## Authorization caveat

Cloudflare per-Worker Editor permission authorizes both candidate upload and
deployment; it does not provide separate upload-only and promote-only roles.
Manual promotion is therefore enforced by the reviewed workflow, protected
branch, and GitHub environment approval rather than by two independent
Cloudflare privileges.

## Failure behavior

- Build or validation failure: no eligible candidate and no production change.
- Upload failure: no promotion job.
- Missing/rejected approval: candidate remains inactive.
- Promotion failure: report observed deployment status and leave or restore the
  last complete version; never rebuild implicitly.
- Smoke-check failure after promotion: preserve evidence, stop subsequent steps,
  and offer explicit rollback to the recorded prior version.

## Rollback

Rollback is a separate authorized operation targeting an explicit previously
deployed version ID at 100% traffic. It records a reason and reruns the public
smoke contract. It never rebuilds the target version. Direct rollback support is
bounded to the platform's 100 most recent published versions.
