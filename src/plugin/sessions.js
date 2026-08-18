import { store } from './storage.js';
import { auditLog } from './audit.js';
import { verifyCredential } from './credentials.js';
import { resolveCapabilities } from './capabilities.js';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function generateSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(credential, installation, entitlements, env) {
  const capabilities = resolveCapabilities(
    credential.accountId,
    credential.productId,
    entitlements
  );

  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const session = {
    id: crypto.randomUUID(),
    token,
    credentialId: credential.id,
    accountId: credential.accountId,
    productId: credential.productId,
    installationId: installation.id,
    capabilities,
    status: 'active',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastAccessedAt: now.toISOString(),
    revokedAt: null,
  };

  await store.sessions.put(`sess:${session.id}`, session);
  await store.sessions.put(`sess-tok:${token}`, session);

  await auditLog('session_created', {
    accountId: credential.accountId,
    credentialId: credential.id,
    installationId: installation.id,
    sessionId: session.id,
    metadata: { capabilities },
  });

  return session;
}

export async function verifySession(token, env) {
  if (!token) return null;

  const session = await store.sessions.get(`sess-tok:${token}`);
  if (!session) return null;

  if (session.status !== 'active') return null;
  if (session.revokedAt) return null;
  if (new Date(session.expiresAt) < new Date()) return null;

  await store.sessions.put(`sess:${session.id}`, {
    ...session,
    lastAccessedAt: new Date().toISOString(),
  });

  return session;
}

export async function revokeSession(sessionId) {
  const session = await store.sessions.get(`sess:${sessionId}`);
  if (!session) return false;

  const updated = {
    ...session,
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  };

  await store.sessions.put(`sess:${sessionId}`, updated);
  await store.sessions.put(`sess-tok:${session.token}`, updated);

  await auditLog('session_expired', {
    accountId: session.accountId,
    sessionId: session.id,
  });

  return true;
}

export async function revokeAllSessionsForInstallation(installationId) {
  const session = await store.sessions.findByInstallationId(installationId);
  if (session) {
    await revokeSession(session.id);
  }
}
