import { store } from './storage.js';
import { auditLog } from './audit.js';
import { PRODUCTS } from './products.js';

const LINK_TTL_MS = 10 * 60 * 1000;

function generateLinkToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, 0)).join('');
}

export async function createLinkTransaction(accountId, productId, data = {}) {
  const token = generateLinkToken();
  const fingerprint = data.fingerprint || null;

  const transaction = {
    id: crypto.randomUUID(),
    token,
    accountId,
    productId,
    fingerprint,
    domain: data.domain || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + LINK_TTL_MS).toISOString(),
    completedAt: null,
    installationId: null,
  };

  await store.linkTransactions.put(`link:${transaction.id}`, transaction);
  await store.linkTransactions.put(`link-tok:${token}`, transaction);

  return transaction;
}

export async function getLinkTransaction(token) {
  return store.linkTransactions.get(`link-tok:${token}`);
}

export async function completeLinkTransaction(token, installationId) {
  const transaction = await store.linkTransactions.get(`link-tok:${token}`);
  if (!transaction) return null;

  if (transaction.status !== 'pending') return null;
  if (new Date(transaction.expiresAt) < new Date()) return null;

  const updated = {
    ...transaction,
    status: 'completed',
    completedAt: new Date().toISOString(),
    installationId,
  };

  await store.linkTransactions.put(`link:${transaction.id}`, updated);
  await store.linkTransactions.put(`link-tok:${token}`, updated);

  await auditLog('installation_linked', {
    accountId: transaction.accountId,
    metadata: { productId: transaction.productId, domain: transaction.domain },
  });

  return updated;
}

export async function expireLinkTransaction(token) {
  const transaction = await store.linkTransactions.get(`link-tok:${token}`);
  if (!transaction) return false;

  const updated = {
    ...transaction,
    status: 'expired',
  };

  await store.linkTransactions.put(`link:${transaction.id}`, updated);
  await store.linkTransactions.put(`link-tok:${token}`, updated);

  return true;
}
