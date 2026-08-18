import { store } from './storage.js';

const LOG_MAX = 1000;

export async function auditLog(event, data = {}) {
  const entry = {
    event,
    accountId: data.accountId || null,
    credentialId: data.credentialId || null,
    installationId: data.installationId || null,
    sessionId: data.sessionId || null,
    ip: data.ip || null,
    userAgent: data.userAgent || null,
    metadata: data.metadata || {},
  };

  await store.auditLogs.append(entry);
}

export function redactSecret(value) {
  if (!value || typeof value !== 'string') return '[REDACTED]';
  if (value.length <= 8) return '[REDACTED]';
  return value.slice(0, 4) + '****' + value.slice(-4);
}
