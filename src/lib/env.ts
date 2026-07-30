import fs from 'node:fs';
import path from 'node:path';

const SERVER_REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NODE_ENV',
  'PORT',
  'INGESTION_QUEUE_BATCH_SIZE',
  'INGESTION_QUEUE_FLUSH_MS',
  'INGESTION_QUEUE_MAX_RETRY',
  'RATE_LIMIT_IP_PER_MIN',
  'RATE_LIMIT_KEY_PER_MIN',
  'ALLOWED_ORIGINS',
  'PULSE_SDK_VERSION',
  'PULSE_COLLECTOR_VERSION',
] as const;

let loaded = false;

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex <= 0) return null;

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

export function loadServerEnv() {
  if (loaded || typeof process === 'undefined') return;

  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      process.env[key] ??= value;
    }
  }

  loaded = true;
}

export function requireServerEnv() {
  loadServerEnv();
  const missing = SERVER_REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required Pulse Analytics environment variable(s): ${missing.join(', ')}. ` +
      'Create/update .env.local for development and do not commit secrets.'
    );
  }
}

export function getRequiredEnv(name: string): string {
  loadServerEnv();
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getRequiredNumberEnv(name: string): number {
  const value = Number(getRequiredEnv(name));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number.`);
  }
  return value;
}
