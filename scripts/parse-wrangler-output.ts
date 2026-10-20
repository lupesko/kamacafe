import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CANONICAL_ORIGIN, WORKER_NAME } from './validate-deployment-config';

export interface ReleaseChecks {
  catalog: boolean;
  types: boolean;
  unit: boolean;
  build: boolean;
  social: boolean;
  deployment: boolean;
}

export interface ReleaseCandidate {
  versionId: string;
  sourceRevision: string;
  versionUrl: string;
  canonicalOrigin: string;
  createdAt: string;
  checks: ReleaseChecks;
  artifactIdentity: string;
  status: 'eligible';
}

interface ParseInput {
  ndjson: string;
  sourceRevision: string;
  canonicalOrigin: string;
  checks: ReleaseChecks;
}

interface WranglerRecord {
  type?: unknown;
  worker_name?: unknown;
  version_id?: unknown;
  preview_url?: unknown;
  timestamp?: unknown;
}

interface WranglerVersion {
  id?: unknown;
  annotations?: Record<string, unknown>;
}

function parseRecords(ndjson: string): WranglerRecord[] {
  return ndjson
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as WranglerRecord;
      } catch {
        throw new Error(`Wrangler output line ${index + 1} is not valid JSON.`);
      }
    });
}

export function parseWranglerVersionUpload(input: ParseInput): ReleaseCandidate {
  if (!/^[0-9a-f]{40}$/i.test(input.sourceRevision)) throw new Error('Source revision must be a full 40-character Git SHA.');
  if (input.canonicalOrigin !== CANONICAL_ORIGIN) throw new Error(`Canonical origin must be exactly ${CANONICAL_ORIGIN}.`);
  if (!Object.values(input.checks).every(Boolean)) throw new Error('All required release checks must pass before eligibility.');

  const uploads = parseRecords(input.ndjson).filter((record) => record.type === 'version-upload');
  if (uploads.length !== 1) throw new Error(`Expected exactly one version-upload record, found ${uploads.length}.`);
  const [upload] = uploads;
  if (upload.worker_name !== WORKER_NAME) throw new Error(`Version upload must target Worker ${WORKER_NAME}.`);

  const versionId = typeof upload.version_id === 'string' ? upload.version_id.trim() : '';
  if (!versionId) throw new Error('Version upload must include a nonblank immutable version ID.');

  const versionUrl = typeof upload.preview_url === 'string' ? upload.preview_url.trim() : '';
  let preview: URL;
  try {
    preview = new URL(versionUrl);
  } catch {
    throw new Error('Version upload must include an absolute preview URL.');
  }
  if (preview.protocol !== 'https:') throw new Error('Version preview URL must use HTTPS.');
  if (preview.origin === input.canonicalOrigin) throw new Error('Version preview URL must not be the canonical production origin.');
  if (!preview.hostname.endsWith('.workers.dev')) throw new Error('Version preview URL must use a Cloudflare workers.dev hostname.');

  return {
    versionId,
    sourceRevision: input.sourceRevision,
    versionUrl: preview.origin,
    canonicalOrigin: input.canonicalOrigin,
    createdAt: typeof upload.timestamp === 'string' ? upload.timestamp : new Date().toISOString(),
    checks: { ...input.checks },
    artifactIdentity: versionId,
    status: 'eligible',
  };
}

export function assertVersionTag(versions: unknown, versionId: string, expectedTag: string): void {
  if (!Array.isArray(versions)) throw new Error('Wrangler versions list must be an array.');
  const version = (versions as WranglerVersion[]).find((candidate) => candidate.id === versionId);
  if (!version) throw new Error(`Uploaded version ${versionId} was not found in the deployable version list.`);
  if (version.annotations?.['workers/tag'] !== expectedTag) {
    throw new Error(`Uploaded version tag does not match source revision ${expectedTag}.`);
  }
}

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`Missing required argument ${name}.`);
  return value;
}

function runCli(): void {
  const sourceRevision = argument('--source-revision');
  const versionsPath = argument('--versions-json');
  const versions = JSON.parse(readFileSync(resolve(versionsPath), 'utf8')) as unknown;
  if (process.argv.includes('--assert-version-tag')) {
    const versionId = argument('--version-id');
    assertVersionTag(versions, versionId, sourceRevision);
    console.log(`Version tag verified for ${versionId}.`);
    return;
  }
  const outputPath = argument('--output');
  const canonicalOrigin = argument('--canonical-origin');
  const candidate = parseWranglerVersionUpload({
    ndjson: readFileSync(resolve(outputPath), 'utf8'),
    sourceRevision,
    canonicalOrigin,
    checks: { catalog: true, types: true, unit: true, build: true, social: true, deployment: true },
  });
  assertVersionTag(versions, candidate.versionId, candidate.sourceRevision);
  process.stdout.write(`${JSON.stringify(candidate)}\n`);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
