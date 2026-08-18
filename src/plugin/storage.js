const stores = {
  credentials: new Map(),
  installations: new Map(),
  sessions: new Map(),
  linkTransactions: new Map(),
  auditLogs: new Map(),
  entitlements: new Map(),
};

export const store = {
  credentials: {
    async put(key, value) { stores.credentials.set(key, JSON.parse(JSON.stringify(value))); },
    async get(key) { const v = stores.credentials.get(key); return v ? JSON.parse(JSON.stringify(v)) : null; },
    async delete(key) { stores.credentials.delete(key); },
    async list(prefix = '') {
      const results = [];
      for (const [k, v] of stores.credentials) {
        if (!prefix || k.startsWith(prefix)) results.push(JSON.parse(JSON.stringify(v)));
      }
      return results;
    },
    async findByPublicId(publicId) {
      for (const [, v] of stores.credentials) {
        if (v.publicId === publicId) return JSON.parse(JSON.stringify(v));
      }
      return null;
    },
    async findByAccountId(accountId) {
      const results = [];
      for (const [, v] of stores.credentials) {
        if (v.accountId === accountId) results.push(JSON.parse(JSON.stringify(v)));
      }
      return results;
    },
  },

  installations: {
    async put(key, value) { stores.installations.set(key, JSON.parse(JSON.stringify(value))); },
    async get(key) { const v = stores.installations.get(key); return v ? JSON.parse(JSON.stringify(v)) : null; },
    async delete(key) { stores.installations.delete(key); },
    async findByAccountId(accountId) {
      const results = [];
      for (const [, v] of stores.installations) {
        if (v.accountId === accountId) results.push(JSON.parse(JSON.stringify(v)));
      }
      return results;
    },
    async findByFingerprint(fingerprint) {
      for (const [, v] of stores.installations) {
        if (v.fingerprint === fingerprint) return JSON.parse(JSON.stringify(v));
      }
      return null;
    },
  },

  sessions: {
    async put(key, value) { stores.sessions.set(key, JSON.parse(JSON.stringify(value))); },
    async get(key) { const v = stores.sessions.get(key); return v ? JSON.parse(JSON.stringify(v)) : null; },
    async delete(key) { stores.sessions.delete(key); },
    async findByInstallationId(installationId) {
      for (const [, v] of stores.sessions) {
        if (v.installationId === installationId && !v.revokedAt && new Date(v.expiresAt) > new Date()) {
          return JSON.parse(JSON.stringify(v));
        }
      }
      return null;
    },
  },

  linkTransactions: {
    async put(key, value) { stores.linkTransactions.set(key, JSON.parse(JSON.stringify(value))); },
    async get(key) { const v = stores.linkTransactions.get(key); return v ? JSON.parse(JSON.stringify(v)) : null; },
    async delete(key) { stores.linkTransactions.delete(key); },
  },

  auditLogs: {
    async append(entry) {
      const id = crypto.randomUUID();
      const record = { id, ...entry, createdAt: new Date().toISOString() };
      stores.auditLogs.set(id, record);
      return record;
    },
    async list(filter = {}) {
      const results = [];
      for (const [, v] of stores.auditLogs) {
        if (filter.accountId && v.accountId !== filter.accountId) continue;
        if (filter.event && v.event !== filter.event) continue;
        results.push(v);
      }
      results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return results.slice(0, filter.limit || 100);
    },
  },

  entitlements: {
    async put(key, value) { stores.entitlements.set(key, JSON.parse(JSON.stringify(value))); },
    async get(key) { const v = stores.entitlements.get(key); return v ? JSON.parse(JSON.stringify(v)) : null; },
    async delete(key) { stores.entitlements.delete(key); },
    async findByAccountId(accountId) {
      const results = [];
      for (const [, v] of stores.entitlements) {
        if (v.accountId === accountId) results.push(JSON.parse(JSON.stringify(v)));
      }
      return results;
    },
  },
};

export function resetStore() {
  for (const map of Object.values(stores)) {
    if (map instanceof Map) map.clear();
  }
}
