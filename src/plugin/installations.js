import { store } from './storage.js';
import { auditLog } from './audit.js';
import { revokeAllSessionsForInstallation } from './sessions.js';

export async function createInstallation(accountId, productId, data = {}) {
  const fingerprint = data.fingerprint || generateFingerprint();

  const existing = await store.installations.findByFingerprint(fingerprint);
  if (existing && existing.accountId === accountId && existing.productId === productId) {
    const updated = {
      ...existing,
      lastSeenAt: new Date().toISOString(),
      pluginVersion: data.pluginVersion || existing.pluginVersion,
      wpVersion: data.wpVersion || existing.wpVersion,
      phpVersion: data.phpVersion || existing.phpVersion,
    };
    await store.installations.put(`inst:${existing.id}`, updated);
    return updated;
  }

  const installation = {
    id: crypto.randomUUID(),
    accountId,
    productId,
    fingerprint,
    domain: data.domain || null,
    status: 'active',
    pluginVersion: data.pluginVersion || null,
    wpVersion: data.wpVersion || null,
    phpVersion: data.phpVersion || null,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    revokedAt: null,
  };

  await store.installations.put(`inst:${installation.id}`, installation);
  await store.installations.put(`inst-fp:${fingerprint}`, installation);

  await auditLog('installation_linked', {
    accountId,
    installationId: installation.id,
    metadata: { domain: data.domain, productId },
  });

  return installation;
}

export async function verifyInstallation(installationId, accountId) {
  const installation = await store.installations.get(`inst:${installationId}`);
  if (!installation) return null;
  if (installation.accountId !== accountId) return null;
  if (installation.status !== 'active') return null;
  if (installation.revokedAt) return null;
  return installation;
}

export async function verifyInstallationByFingerprint(fingerprint, accountId) {
  const installation = await store.installations.findByFingerprint(fingerprint);
  if (!installation) return null;
  if (installation.accountId !== accountId) return null;
  if (installation.status !== 'active') return null;
  if (installation.revokedAt) return null;
  return installation;
}

export async function revokeInstallation(installationId) {
  const installation = await store.installations.get(`inst:${installationId}`);
  if (!installation) return false;

  const updated = {
    ...installation,
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  };

  await store.installations.put(`inst:${installationId}`, updated);
  await store.installations.put(`inst-fp:${installation.fingerprint}`, updated);

  await revokeAllSessionsForInstallation(installationId);

  await auditLog('installation_unlinked', {
    accountId: installation.accountId,
    installationId: installation.id,
  });

  return true;
}

export async function listInstallationsByAccount(accountId) {
  return store.installations.findByAccountId(accountId);
}

function generateFingerprint() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
