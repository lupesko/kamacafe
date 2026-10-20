import { describe, expect, it } from 'vitest';
import {
  assertVersionTag,
  parseWranglerVersionUpload,
  type ReleaseChecks,
} from '../../scripts/parse-wrangler-output';

const sourceRevision = '0123456789abcdef0123456789abcdef01234567';
const canonicalOrigin = 'https://kamacafe.lupesko.com';
const versionId = '12345678-1234-4234-8234-123456789abc';
const previewUrl = 'https://12345678-kamacafe.example.workers.dev';
const checks: ReleaseChecks = {
  catalog: true,
  types: true,
  unit: true,
  build: true,
  social: true,
  deployment: true,
};

function upload(overrides: Record<string, unknown> = {}): string {
  return [
    JSON.stringify({ type: 'wrangler-session', version: 1 }),
    JSON.stringify({
      type: 'version-upload',
      version: 1,
      worker_name: 'kamacafe',
      version_id: versionId,
      preview_url: previewUrl,
      ...overrides,
    }),
  ].join('\n');
}

describe('Wrangler version upload output', () => {
  it('creates an eligible immutable release candidate from one valid upload', () => {
    expect(parseWranglerVersionUpload({ ndjson: upload(), sourceRevision, canonicalOrigin, checks })).toMatchObject({
      versionId,
      sourceRevision,
      versionUrl: previewUrl,
      canonicalOrigin,
      status: 'eligible',
    });
  });

  it('requires exactly one version-upload record', () => {
    expect(() => parseWranglerVersionUpload({ ndjson: '', sourceRevision, canonicalOrigin, checks })).toThrow(/exactly one/i);
    expect(() =>
      parseWranglerVersionUpload({
        ndjson: `${upload()}\n${JSON.stringify({ type: 'version-upload', version_id: 'other', preview_url: previewUrl })}`,
        sourceRevision,
        canonicalOrigin,
        checks,
      }),
    ).toThrow(/exactly one/i);
  });

  it.each([
    ['blank version ID', { version_id: ' ' }],
    ['malformed preview URL', { preview_url: 'not-a-url' }],
    ['insecure preview URL', { preview_url: 'http://preview.example.workers.dev' }],
    ['canonical preview URL', { preview_url: canonicalOrigin }],
  ])('rejects a %s', (_name, overrides) => {
    expect(() => parseWranglerVersionUpload({ ndjson: upload(overrides), sourceRevision, canonicalOrigin, checks })).toThrow();
  });

  it('requires a full Git SHA and exact canonical origin', () => {
    expect(() => parseWranglerVersionUpload({ ndjson: upload(), sourceRevision: 'abc123', canonicalOrigin, checks })).toThrow(/revision/i);
    expect(() =>
      parseWranglerVersionUpload({
        ndjson: upload(),
        sourceRevision,
        canonicalOrigin: 'https://other.example.com',
        checks,
      }),
    ).toThrow(/canonical/i);
  });

  it('does not mark a candidate eligible until every release check passes', () => {
    expect(() =>
      parseWranglerVersionUpload({
        ndjson: upload(),
        sourceRevision,
        canonicalOrigin,
        checks: { ...checks, social: false },
      }),
    ).toThrow(/checks/i);
  });

  it('rejects a missing or mismatched commit tag for the uploaded version', () => {
    const versions = [{ id: versionId, annotations: { 'workers/tag': sourceRevision } }];
    expect(() => assertVersionTag(versions, versionId, sourceRevision)).not.toThrow();
    expect(() => assertVersionTag(versions, versionId, 'f'.repeat(40))).toThrow(/tag/i);
    expect(() => assertVersionTag([], versionId, sourceRevision)).toThrow(/version/i);
  });
});
