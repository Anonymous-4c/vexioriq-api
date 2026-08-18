import { store } from './storage.js';
import { auditLog } from './audit.js';

const RESOURCE_TTL_MS = 5 * 60 * 1000;

export async function createResourceAuth(sessionId, resourceType, resourceScope) {
  const token = generateResourceToken();
  const now = new Date();

  const auth = {
    id: crypto.randomUUID(),
    token,
    sessionId,
    resourceType,
    resourceScope,
    status: 'active',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RESOURCE_TTL_MS).toISOString(),
    usedCount: 0,
    maxUses: 10,
  };

  await store.sessions.put(`rauth:${token}`, auth);
  return auth;
}

export async function verifyResourceAuth(token, sessionId) {
  if (!token) return null;

  const auth = await store.sessions.get(`rauth:${token}`);
  if (!auth) return null;

  if (auth.sessionId !== sessionId) return null;
  if (auth.status !== 'active') return null;
  if (new Date(auth.expiresAt) < new Date()) return null;
  if (auth.usedCount >= auth.maxUses) return null;

  await store.sessions.put(`rauth:${token}`, {
    ...auth,
    usedCount: auth.usedCount + 1,
  });

  return auth;
}

export async function revokeResourceAuth(token) {
  const auth = await store.sessions.get(`rauth:${token}`);
  if (!auth) return false;

  await store.sessions.put(`rauth:${token}`, {
    ...auth,
    status: 'revoked',
  });

  return true;
}

function generateResourceToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'ra_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
