import { config } from '../config/config.js';

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function generateApiKey() {
  const prefix = config.apiKey.prefix;
  const randomPart = bytesToHex(generateRandomBytes(config.apiKey.keyLength / 2));
  return `${prefix}${randomPart}`;
}

export function extractKeyPrefix(apiKey) {
  if (!apiKey || !apiKey.startsWith(config.apiKey.prefix)) return null;
  return apiKey.slice(0, config.apiKey.prefix.length + 8);
}

export async function hashApiKey(apiKey, hmacSecret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const secretData = encoder.encode(hmacSecret || 'default-dev-secret');

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, keyData);
  return bytesToHex(new Uint8Array(signature));
}

export async function verifyApiKey(apiKey, env) {
  if (!apiKey || !apiKey.startsWith(config.apiKey.prefix)) {
    return null;
  }

  const hmacSecret = env.API_KEY_HMAC_SECRET || 'default-dev-secret';
  const hashedKey = await hashApiKey(apiKey, hmacSecret);

  const stored = await env.API_KEYS_KV?.get(hashedKey, { type: 'json' });
  if (!stored) {
    return null;
  }

  if (env.API_KEYS_KV) {
    await env.API_KEYS_KV.put(
      hashedKey,
      JSON.stringify({ ...stored, lastUsedAt: new Date().toISOString() }),
      { expirationTtl: undefined }
    );
  }

  return stored;
}

export async function registerApiKey(apiKey, metadata, env) {
  const hmacSecret = env.API_KEY_HMAC_SECRET || 'default-dev-secret';
  const hashedKey = await hashApiKey(apiKey, hmacSecret);

  const record = {
    id: metadata.id || crypto.randomUUID(),
    keyPrefix: extractKeyPrefix(apiKey),
    name: metadata.name || 'Unnamed Key',
    scopes: metadata.scopes || ['tools:read', 'tools:execute'],
    plan: metadata.plan || 'free',
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
    expiresAt: metadata.expiresAt || null,
  };

  if (env.API_KEYS_KV) {
    await env.API_KEYS_KV.put(hashedKey, JSON.stringify(record));
  }

  return { apiKey, record };
}

export async function revokeApiKey(apiKey, env) {
  const hmacSecret = env.API_KEY_HMAC_SECRET || 'default-dev-secret';
  const hashedKey = await hashApiKey(apiKey, hmacSecret);

  const stored = await env.API_KEYS_KV?.get(hashedKey, { type: 'json' });
  if (!stored) return false;

  stored.revokedAt = new Date().toISOString();

  if (env.API_KEYS_KV) {
    await env.API_KEYS_KV.put(hashedKey, JSON.stringify(stored));
  }

  return true;
}
