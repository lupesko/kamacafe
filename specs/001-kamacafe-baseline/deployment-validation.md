# Deployment Validation

## Local implementation validation

Date: 2026-09-28

| Check | Result | Evidence |
|---|---|---|
| Node runtime | PASS | Node.js 24.21.0 used for project commands; `.nvmrc` pins major 24 |
| Dependency install | PASS | `npm install`; lockfile generated |
| Catalog validation | PASS | 2 categories and 11 drinks validated, including schema, inheritance, IDs, and images |
| Type checking | PASS | `npm run typecheck` completed without errors |
| Unit tests | PASS | 3 files, 25 tests |
| Production build | PASS | Vite 8 production bundle generated in `dist/` |
| Terraform format | PASS | Terraform 1.14.6 formatted `infra/` |
| Terraform initialization | PASS | AWS 6.66.0 and Cloudflare 5.26.0 providers initialized with backend disabled |
| Terraform validation | PASS | Configuration is valid |
| Runtime dependency audit | PASS | `npm audit --omit=dev` reports zero production vulnerabilities |
| Browser/axe suite | ENVIRONMENT BLOCKED | Test files and browser binaries are present, but the Codex macOS sandbox denies browser Mach service registration; run `npm run test:e2e` in a normal terminal or CI |
| Lighthouse | PENDING LOCAL TERMINAL | Run `npm run test:performance` after browser access is available |

The full development-tool audit reports advisories in the current Lighthouse CI dependency tree, with no upstream fix available in `@lhci/cli` 0.15.1. Those packages do not ship in the application bundle. Recheck on dependency upgrades and keep the CI runner isolated from untrusted archives.

## Production plan and apply

Pending. The current `infra/production.tfvars.example` contains deliberate placeholders. Do not plan or apply until the operator supplies and reviews:

- canonical site hostname;
- AWS website and state regions;
- Cloudflare zone ID;
- pre-created encrypted/versioned Terraform-state bucket and key;
- existing GitHub Actions OIDC provider ARN;
- protected-environment Terraform role and scoped Cloudflare token.

When supplied, record the reviewed plan summary, approval, apply result, canonical HTTPS URL, bucket name, website endpoint, and deployment role ARN here. Do not record secrets, token values, AWS session material, or state content.
