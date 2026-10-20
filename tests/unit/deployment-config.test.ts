import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ORIGIN,
  collectDeploymentConfigErrors,
  type DeploymentConfigValidationInput,
} from '../../scripts/validate-deployment-config';

const validConfig = {
  name: 'kamacafe',
  compatibility_date: '2026-10-19',
  workers_dev: false,
  preview_urls: true,
  assets: {
    directory: './dist',
    not_found_handling: 'none',
  },
  routes: [{ pattern: 'kamacafe.lupesko.com', custom_domain: true }],
};

const validHeaders = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()

/
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=86400

https://:version.:subdomain.workers.dev/*
  X-Robots-Tag: noindex
`;

function validInput(): DeploymentConfigValidationInput {
  return {
    config: structuredClone(validConfig),
    headers: validHeaders,
    assetFiles: [
      { path: 'index.html', size: 2_000 },
      { path: 'assets/app-abc123.js', size: 20_000 },
    ],
    activeFiles: {
      '.github/workflows/deploy.yml': 'npx wrangler versions upload',
      'README.md': `Production: ${CANONICAL_ORIGIN}`,
    },
  };
}

describe('deployment configuration validation', () => {
  it('accepts the minimal static-assets-only contract', () => {
    expect(collectDeploymentConfigErrors(validInput())).toEqual([]);
  });

  it('rejects runtime entry points and asset bindings', () => {
    const withMain = validInput();
    withMain.config = { ...validConfig, main: 'src/worker.ts' };
    expect(collectDeploymentConfigErrors(withMain).join('\n')).toMatch(/main|runtime/i);

    const withBinding = validInput();
    withBinding.config = {
      ...validConfig,
      assets: { ...validConfig.assets, binding: 'ASSETS' },
    };
    expect(collectDeploymentConfigErrors(withBinding).join('\n')).toMatch(/binding/i);
  });

  it('rejects artifacts above Workers Free static-asset limits', () => {
    const tooMany = validInput();
    tooMany.assetFiles = Array.from({ length: 20_001 }, (_, index) => ({
      path: `assets/${index}.txt`,
      size: 1,
    }));
    expect(collectDeploymentConfigErrors(tooMany).join('\n')).toMatch(/20,000/i);

    const tooLarge = validInput();
    tooLarge.assetFiles = [{ path: 'images/huge.png', size: 25 * 1024 * 1024 + 1 }];
    expect(collectDeploymentConfigErrors(tooLarge).join('\n')).toMatch(/25 MiB/i);
  });

  it('rejects _headers above rule and line limits', () => {
    const tooManyRules = validInput();
    tooManyRules.headers = Array.from({ length: 101 }, (_, index) => `/path-${index}\n  X-Test: true`).join('\n\n');
    expect(collectDeploymentConfigErrors(tooManyRules).join('\n')).toMatch(/100 header rules/i);

    const longLine = validInput();
    longLine.headers = `/*\n  X-Test: ${'x'.repeat(2_001)}`;
    expect(collectDeploymentConfigErrors(longLine).join('\n')).toMatch(/2,000 characters/i);
  });

  it('rejects active legacy deployment dependencies', () => {
    const candidate = validInput();
    candidate.activeFiles = {
      '.github/workflows/deploy.yml': 'terraform apply\naws s3 sync dist s3://bucket',
    };
    expect(collectDeploymentConfigErrors(candidate).join('\n')).toMatch(/legacy deployment dependency/i);
  });

  it('rejects credential material but permits protected secret references', () => {
    const reference = validInput();
    reference.activeFiles = {
      '.github/workflows/deploy.yml': 'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    };
    expect(collectDeploymentConfigErrors(reference)).toEqual([]);

    const leaked = validInput();
    leaked.activeFiles = {
      '.github/workflows/deploy.yml': 'AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF',
    };
    expect(collectDeploymentConfigErrors(leaked).join('\n')).toMatch(/credential material/i);
  });

  it('keeps the checked-in Worker and response-header contract valid', () => {
    const root = resolve(import.meta.dirname, '../..');
    const input = validInput();
    input.config = JSON.parse(readFileSync(resolve(root, 'wrangler.jsonc'), 'utf8')) as Record<string, unknown>;
    input.headers = readFileSync(resolve(root, 'public/_headers'), 'utf8');
    expect(collectDeploymentConfigErrors(input)).toEqual([]);
  });

  it('enforces build-once candidate upload and exact manual promotion in the deploy workflow', () => {
    const root = resolve(import.meta.dirname, '../..');
    const workflow = readFileSync(resolve(root, '.github/workflows/deploy.yml'), 'utf8');
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).not.toMatch(/^\s+push:/m);
    expect(workflow).toMatch(/\n  candidate:/);
    expect(workflow).toMatch(/VITE_SITE_URL:\s*https:\/\/kamacafe\.lupesko\.com/);
    expect(workflow).toMatch(/npm run validate:social -- --production[\s\S]*npm run validate:deployment[\s\S]*wrangler versions upload/);
    expect(workflow).toMatch(/WRANGLER_OUTPUT_FILE_PATH/);
    expect(workflow).toMatch(/parse-wrangler-output\.ts/);

    const promotion = workflow.split('\n  promote:')[1] ?? '';
    expect(promotion).toMatch(/needs:\s*candidate/);
    expect(promotion).toMatch(/environment:[\s\S]*name:\s*production/);
    expect(promotion).toMatch(/wrangler versions deploy[^\n]*version_id[^\n]*@100%[^\n]*--yes/);
    expect(promotion).not.toMatch(/npm run build|wrangler versions upload/);
    expect((workflow.match(/npm run build/g) ?? [])).toHaveLength(1);
  });

  it('enforces explicit reviewer-gated exact-version rollback without rebuilding', () => {
    const root = resolve(import.meta.dirname, '../..');
    const workflow = readFileSync(resolve(root, '.github/workflows/rollback.yml'), 'utf8');
    expect(workflow).toMatch(/workflow_dispatch:[\s\S]*version_id:[\s\S]*required:\s*true[\s\S]*reason:[\s\S]*required:\s*true/);
    expect(workflow).toMatch(/environment:[\s\S]*name:\s*production/);
    expect(workflow).toMatch(/wrangler deployments list --json/);
    expect(workflow).toMatch(/wrangler rollback "\$TARGET_VERSION" --message "\$ROLLBACK_REASON" --yes/);
    expect(workflow).toMatch(/verify-production-deployment\.ts[^\n]*--expected-version "\$TARGET_VERSION"/);
    expect(workflow).not.toMatch(/npm run build|wrangler versions upload/);
  });
});
