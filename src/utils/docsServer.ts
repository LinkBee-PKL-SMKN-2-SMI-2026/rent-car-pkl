import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DEFAULT_APP_URL = 'http://localhost:3000';
const BUNDLE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../docs/bundle/openapi.yaml',
);

export function getApiBaseUrl(): string {
  const base = (process.env.APP_URL ?? DEFAULT_APP_URL).trim().replace(/\/+$/, '');
  return `${base}/api`;
}

export async function serveOpenApiYaml(): Promise<string> {
  const yaml = await readFile(BUNDLE_PATH, 'utf8');
  const serverUrl = getApiBaseUrl();
  const description = serverUrl.includes('localhost') ? 'Local development' : 'Production';

  return yaml.replace(
    /servers:\n {2}- url: .*\n {4}description: .*\n/,
    `servers:\n  - url: ${serverUrl}\n    description: ${description}\n`,
  );
}
