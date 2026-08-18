import { store } from './storage.js';
import { auditLog } from './audit.js';
import { PRODUCTS } from './products.js';

const LIVE_PREFIX = 'vx_live_';
const PUBLIC_ID_LENGTH = 16;
const SECRET_LENGTH = 48;

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomHex(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function generatePublicId() {
  return generateRandomHex(PUBLIC_ID_LENGTH);
}

function generateSecret() {
  return generateRandomHex(SECRET_LENGTH);
}

export async function hashSecret(secret, hmacSecret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
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

export async function createCredential(accountId, productId, name, env) {
  if (!PRODUCTS[productId]) {
    throw new Error(`Invalid product: ${productId}`);
  }

  const publicId = generatePublicId();
  const secret = generateSecret();
  const fullKey = `${LIVE_PREFIX}${publicId}_${secret}`;

  const hmacSecret = env.API_KEY_HMAC_SECRET || 'default-dev-secret';
  const secretHash = await hashSecret(secret, hmacSecret);

  const credential = {
    id: crypto.randomUUID(),
    publicId,
    accountId,
    productId,
    name: name || 'Unnamed Credential',
    secretHash,
    status: 'active',
    scopes: ['tools:read', 'tools:execute'],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
    expiresAt: null,
  };

  await store.credentials.put(`cred:${credential.id}`, credential);
  await store.credentials.put(`cred-pub:${publicId}`, credential);

  await auditLog('credential_created', {
    accountId,
    credentialId: credential.id,
    metadata: { productId, name },
  });

  return { credential, apiKey: fullKey };
}

export async function verifyCredential(apiKey, env) {
  if (!apiKey || !apiKey.startsWith(LIVE_PREFIX)) return null;

  const withoutPrefix = apiKey.slice(LIVE_PREFIX.length);
  const parts = withoutPrefix.split('_');
  if (parts.length < 2) return null;

  const publicId = parts[0];

  const credential = await store.credentials.get(`cred-pub:${publicId}`);
  if (!credential) return null;

  if (credential.status !== 'active') return null;
  if (credential.revokedAt) return null;
  if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) return null;

  const secret = parts.slice(1).join('_');
  const hmacSecret = env.API_KEY_HMAC_SECRET || 'default-dev-secret';
  const computedHash = await hashSecret(secret, hmacSecret);

  if (computedHash !== credential.secretHash) return null;

  await store.credentials.put(`cred:${credential.id}`, {
    ...credential,
    lastUsedAt: new Date().toISOString(),
  });

  return credential;
}

export async function revokeCredential(credentialId, env) {
  const credential = await store.credentials.get(`cred:${credentialId}`);
  if (!credential) return false;

  const updated = {
    ...credential,
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  };

  await store.credentials.put(`cred:${credentialId}`, updated);
  await store.credentials.put(`cred-pub:${credential.publicId}`, updated);

  await auditLog('credential_revoked', {
    accountId: credential.accountId,
    credentialId: credential.id,
  });

  return true;
}

export async function getCredentialById(credentialId) {
  return store.credentials.get(`cred:${credentialId}`);
}

export async function listCredentialsByAccount(accountId) {
  return store.credentials.findByAccountId(accountId);
}
