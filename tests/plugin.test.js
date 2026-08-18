import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { resetStore } from '../src/plugin/storage.js';
import { resetPluginRateLimit } from '../src/plugin/rateLimit.js';
import { createCredential, hashSecret } from '../src/plugin/credentials.js';
import { createInstallation } from '../src/plugin/installations.js';
import { createLinkTransaction } from '../src/plugin/linking.js';
import { store } from '../src/plugin/storage.js';
import { PRODUCTS } from '../src/plugin/products.js';

const MOCK_ENV = {
  API_KEY_HMAC_SECRET: 'test-hmac-secret-key-for-testing',
  CORS_ORIGINS: '',
};

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  const url = `https://api.vexioriq.com${path}`;
  const opts = { method, headers: { ...headers } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return worker.fetch(new Request(url, opts), MOCK_ENV, {});
}

async function createTestCredential(accountId = 'acct_test_001', productId = 'wp-ai-studio') {
  const result = await createCredential(accountId, productId, 'Test Key', MOCK_ENV);
  return result;
}

async function createTestInstallation(accountId = 'acct_test_001', productId = 'wp-ai-studio') {
  return createInstallation(accountId, productId, {
    domain: 'https://example.com',
    fingerprint: 'fp_' + crypto.randomUUID().replace(/-/g, '').slice(0, 32),
    pluginVersion: '1.0.0',
    wpVersion: '6.5',
    phpVersion: '8.2',
  });
}

async function createTestEntitlement(accountId = 'acct_test_001', productId = 'wp-ai-studio') {
  const ent = {
    id: crypto.randomUUID(),
    accountId,
    productId,
    status: 'active',
    plan: 'pro',
    createdAt: new Date().toISOString(),
  };
  await store.entitlements.put(`ent:${accountId}:${productId}`, ent);
  return ent;
}

describe('Plugin: Credential System', () => {
  beforeEach(() => { resetStore(); resetPluginRateLimit(); });

  it('creates credential with vx_live_ prefix', async () => {
    const result = await createTestCredential();
    assert.ok(result.apiKey.startsWith('vx_live_'));
    assert.ok(result.credential.id);
    assert.ok(result.credential.publicId);
    assert.equal(result.credential.productId, 'wp-ai-studio');
    assert.equal(result.credential.status, 'active');
  });

  it('generates unique credentials', async () => {
    const r1 = await createTestCredential();
    const r2 = await createTestCredential();
    assert.notEqual(r1.apiKey, r2.apiKey);
    assert.notEqual(r1.credential.id, r2.credential.id);
  });

  it('rejects invalid product', async () => {
    await assert.rejects(
      () => createCredential('acct', 'nonexistent', 'key', MOCK_ENV),
      /Invalid product/
    );
  });

  it('verifies valid credential', async () => {
    const { apiKey } = await createTestCredential();
    const { verifyCredential } = await import('../src/plugin/credentials.js');
    const result = await verifyCredential(apiKey, MOCK_ENV);
    assert.ok(result);
    assert.equal(result.status, 'active');
  });

  it('rejects invalid key format', async () => {
    const { verifyCredential } = await import('../src/plugin/credentials.js');
    const result = await verifyCredential('invalid_key', MOCK_ENV);
    assert.equal(result, null);
  });

  it('rejects wrong secret', async () => {
    const { credential } = await createTestCredential();
    const { verifyCredential } = await import('../src/plugin/credentials.js');
    const result = await verifyCredential(`vx_live_${credential.publicId}_wrongsecret`, MOCK_ENV);
    assert.equal(result, null);
  });

  it('revokes credential', async () => {
    const { credential, apiKey } = await createTestCredential();
    const { revokeCredential, verifyCredential } = await import('../src/plugin/credentials.js');
    await revokeCredential(credential.id, MOCK_ENV);
    const result = await verifyCredential(apiKey, MOCK_ENV);
    assert.equal(result, null);
  });
});

describe('Plugin: Installation System', () => {
  beforeEach(() => { resetStore(); resetPluginRateLimit(); });

  it('creates installation', async () => {
    const inst = await createTestInstallation();
    assert.ok(inst.id);
    assert.equal(inst.status, 'active');
    assert.equal(inst.domain, 'https://example.com');
  });

  it('verifies valid installation', async () => {
    const inst = await createTestInstallation();
    const { verifyInstallation } = await import('../src/plugin/installations.js');
    const result = await verifyInstallation(inst.id, 'acct_test_001');
    assert.ok(result);
    assert.equal(result.id, inst.id);
  });

  it('rejects wrong account', async () => {
    const inst = await createTestInstallation();
    const { verifyInstallation } = await import('../src/plugin/installations.js');
    const result = await verifyInstallation(inst.id, 'acct_wrong');
    assert.equal(result, null);
  });

  it('revokes installation', async () => {
    const inst = await createTestInstallation();
    const { revokeInstallation, verifyInstallation } = await import('../src/plugin/installations.js');
    await revokeInstallation(inst.id);
    const result = await verifyInstallation(inst.id, 'acct_test_001');
    assert.equal(result, null);
  });

  it('reuses existing installation for same fingerprint', async () => {
    const fp = 'fp_' + crypto.randomUUID().replace(/-/g, '').slice(0, 32);
    const i1 = await createInstallation('acct', 'wp-ai-studio', { fingerprint: fp });
    const i2 = await createInstallation('acct', 'wp-ai-studio', { fingerprint: fp });
    assert.equal(i1.id, i2.id);
  });
});

describe('Plugin: Link Transaction', () => {
  beforeEach(() => { resetStore(); resetPluginRateLimit(); });

  it('creates link transaction', async () => {
    const tx = await createLinkTransaction('acct', 'wp-ai-studio', { domain: 'test.com' });
    assert.ok(tx.token);
    assert.equal(tx.status, 'pending');
  });

  it('completes link transaction', async () => {
    const tx = await createLinkTransaction('acct', 'wp-ai-studio', {});
    const inst = await createTestInstallation('acct');
    const { completeLinkTransaction } = await import('../src/plugin/linking.js');
    const result = await completeLinkTransaction(tx.token, inst.id);
    assert.equal(result.status, 'completed');
    assert.equal(result.installationId, inst.id);
  });

  it('rejects already-completed transaction', async () => {
    const tx = await createLinkTransaction('acct', 'wp-ai-studio', {});
    const inst = await createTestInstallation('acct');
    const { completeLinkTransaction } = await import('../src/plugin/linking.js');
    await completeLinkTransaction(tx.token, inst.id);
    const result = await completeLinkTransaction(tx.token, inst.id);
    assert.equal(result, null);
  });
});

describe('Plugin: Capability System', () => {
  it('has correct capabilities for wp-ai-studio', () => {
    const product = PRODUCTS['wp-ai-studio'];
    assert.ok(product);
    assert.ok(product.capabilities.includes('ai.generate.post'));
    assert.ok(product.capabilities.includes('ai.generate.page'));
    assert.ok(product.capabilities.includes('resource.patterns'));
  });

  it('resolves capabilities for entitled account', async () => {
    const { resolveCapabilities } = await import('../src/plugin/capabilities.js');
    const ent = await createTestEntitlement();
    const caps = resolveCapabilities('acct_test_001', 'wp-ai-studio', [ent]);
    assert.ok(caps.includes('ai.generate.post'));
  });

  it('returns empty for non-entitled account', async () => {
    const { resolveCapabilities } = await import('../src/plugin/capabilities.js');
    const caps = resolveCapabilities('acct_test_001', 'wp-ai-studio', []);
    assert.equal(caps.length, 0);
  });

  it('checks capability correctly', async () => {
    const { hasCapability } = await import('../src/plugin/capabilities.js');
    assert.ok(hasCapability(['ai.generate.post', 'ai.generate.page'], 'ai.generate.post'));
    assert.ok(!hasCapability(['ai.generate.post'], 'ai.generate.page'));
  });
});

describe('Plugin: Session System', () => {
  beforeEach(() => { resetStore(); resetPluginRateLimit(); });

  it('creates session', async () => {
    const { credential } = await createTestCredential();
    const inst = await createTestInstallation();
    const ent = await createTestEntitlement();
    const { createSession } = await import('../src/plugin/sessions.js');
    const session = await createSession(credential, inst, [ent], MOCK_ENV);
    assert.ok(session.token);
    assert.ok(session.expiresAt);
    assert.ok(session.capabilities.length > 0);
  });

  it('verifies valid session', async () => {
    const { credential } = await createTestCredential();
    const inst = await createTestInstallation();
    const ent = await createTestEntitlement();
    const { createSession, verifySession } = await import('../src/plugin/sessions.js');
    const session = await createSession(credential, inst, [ent], MOCK_ENV);
    const result = await verifySession(session.token, MOCK_ENV);
    assert.ok(result);
    assert.equal(result.id, session.id);
  });

  it('rejects invalid session token', async () => {
    const { verifySession } = await import('../src/plugin/sessions.js');
    const result = await verifySession('invalid_token', MOCK_ENV);
    assert.equal(result, null);
  });

  it('revokes session', async () => {
    const { credential } = await createTestCredential();
    const inst = await createTestInstallation();
    const ent = await createTestEntitlement();
    const { createSession, revokeSession, verifySession } = await import('../src/plugin/sessions.js');
    const session = await createSession(credential, inst, [ent], MOCK_ENV);
    await revokeSession(session.id);
    const result = await verifySession(session.token, MOCK_ENV);
    assert.equal(result, null);
  });
});

describe('Plugin: API Endpoints', () => {
  beforeEach(() => { resetStore(); resetPluginRateLimit(); });

  it('POST /v1/plugin/link/initiate creates transaction', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();
    const res = await makeRequest('/v1/plugin/link/initiate', 'POST', {
      productId: 'wp-ai-studio',
      domain: 'https://example.com',
    }, { Authorization: `Bearer ${apiKey}` });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.token);
    assert.ok(data.data.transactionId);
  });

  it('POST /v1/plugin/link/initiate rejects without credential', async () => {
    const res = await makeRequest('/v1/plugin/link/initiate', 'POST', {});
    assert.equal(res.status, 401);
  });

  it('POST /v1/plugin/credentials creates new credential', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();
    const res = await makeRequest('/v1/plugin/credentials', 'POST', {
      productId: 'wp-ai-studio',
      name: 'My Plugin Key',
    }, { Authorization: `Bearer ${apiKey}` });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.ok(data.data.apiKey.startsWith('vx_live_'));
    assert.ok(data.data.credential.id);
  });

  it('GET /v1/plugin/credentials lists credentials', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();
    await makeRequest('/v1/plugin/credentials', 'POST', {
      productId: 'wp-ai-studio', name: 'Key 1',
    }, { Authorization: `Bearer ${apiKey}` });
    const res = await makeRequest('/v1/plugin/credentials', 'GET', null, {
      Authorization: `Bearer ${apiKey}`,
    });
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.credentials.length > 0);
  });

  it('POST /v1/plugin/session creates session', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();
    const inst = await createTestInstallation();
    const res = await makeRequest('/v1/plugin/session', 'POST', {
      installationId: inst.id,
    }, { Authorization: `Bearer ${apiKey}` });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.ok(data.data.session.token);
    assert.ok(data.data.session.capabilities);
  });

  it('GET /v1/plugin/session verifies session', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();
    const inst = await createTestInstallation();
    const sessionRes = await makeRequest('/v1/plugin/session', 'POST', {
      installationId: inst.id,
    }, { Authorization: `Bearer ${apiKey}` });
    const sessionData = await sessionRes.json();
    const token = sessionData.data.session.token;
    const res = await makeRequest('/v1/plugin/session', 'GET', null, {
      Authorization: `Bearer ${token}`,
    });
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.session.capabilities);
  });

  it('POST /v1/plugin/generate requires session', async () => {
    const res = await makeRequest('/v1/plugin/generate', 'POST', {
      capability: 'ai.generate.post',
      prompt: 'Hello',
      providerConfig: { provider: 'openai', apiKey: 'sk-test' },
    });
    assert.equal(res.status, 401);
  });

  it('POST /v1/plugin/generate with valid session', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();
    const inst = await createTestInstallation();
    const sessionRes = await makeRequest('/v1/plugin/session', 'POST', {
      installationId: inst.id,
    }, { Authorization: `Bearer ${apiKey}` });
    const sessionData = await sessionRes.json();
    const token = sessionData.data.session.token;

    const res = await makeRequest('/v1/plugin/generate', 'POST', {
      capability: 'ai.generate.post',
      prompt: 'Write a blog post about WordPress',
      providerConfig: { provider: 'openai', apiKey: 'sk-test123' },
    }, { Authorization: `Bearer ${token}` });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.orchestration);
    assert.ok(data.data.resourceToken);
  });

  it('GET /v1/plugin/installations lists installations', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();
    await createTestInstallation();
    const res = await makeRequest('/v1/plugin/installations', 'GET', null, {
      Authorization: `Bearer ${apiKey}`,
    });
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.installations.length > 0);
  });

  it('returns 404 for unknown plugin routes', async () => {
    const res = await makeRequest('/v1/plugin/nonexistent');
    assert.equal(res.status, 404);
  });
});

describe('Plugin: Security - Copied Plugin Attack', () => {
  beforeEach(() => { resetStore(); resetPluginRateLimit(); });

  it('blocks access without valid credential', async () => {
    const res = await makeRequest('/v1/plugin/link/initiate', 'POST', {
      productId: 'wp-ai-studio',
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it('blocks access with invalid credential format', async () => {
    const res = await makeRequest('/v1/plugin/link/initiate', 'POST', {
      productId: 'wp-ai-studio',
    }, { Authorization: 'Bearer fake_key_123' });
    assert.equal(res.status, 401);
  });

  it('blocks access with non-existent credential', async () => {
    const res = await makeRequest('/v1/plugin/link/initiate', 'POST', {
      productId: 'wp-ai-studio',
    }, { Authorization: 'Bearer vx_live_0000000000000000_00000000000000000000000000000000000000000000000' });
    assert.equal(res.status, 401);
  });

  it('blocks session creation without installation', async () => {
    const { apiKey } = await createTestCredential();
    const res = await makeRequest('/v1/plugin/session', 'POST', {
      installationId: 'nonexistent',
    }, { Authorization: `Bearer ${apiKey}` });
    assert.equal(res.status, 403);
  });

  it('blocks generate without session', async () => {
    const res = await makeRequest('/v1/plugin/generate', 'POST', {
      capability: 'ai.generate.post',
      prompt: 'test',
      providerConfig: { provider: 'openai', apiKey: 'sk-test' },
    });
    assert.equal(res.status, 401);
  });
});

describe('Plugin: Full Authorization Flow', () => {
  beforeEach(() => { resetStore(); resetPluginRateLimit(); });

  it('complete flow: credential -> link -> session -> generate', async () => {
    const { apiKey } = await createTestCredential();
    const ent = await createTestEntitlement();

    const linkRes = await makeRequest('/v1/plugin/link/initiate', 'POST', {
      productId: 'wp-ai-studio',
      domain: 'https://mysite.com',
    }, { Authorization: `Bearer ${apiKey}` });
    const linkData = await linkRes.json();
    assert.equal(linkRes.status, 201);

    const completeRes = await makeRequest('/v1/plugin/link/complete', 'POST', {
      token: linkData.data.token,
      fingerprint: 'fp_abc123def456',
      domain: 'https://mysite.com',
      pluginVersion: '1.0.0',
    }, { Authorization: `Bearer ${apiKey}` });
    const completeData = await completeRes.json();
    assert.equal(completeRes.status, 201);
    const installationId = completeData.data.installationId;

    const sessionRes = await makeRequest('/v1/plugin/session', 'POST', {
      installationId,
    }, { Authorization: `Bearer ${apiKey}` });
    const sessionData = await sessionRes.json();
    assert.equal(sessionRes.status, 201);
    const token = sessionData.data.session.token;
    assert.ok(sessionData.data.session.capabilities.includes('ai.generate.post'));

    const genRes = await makeRequest('/v1/plugin/generate', 'POST', {
      capability: 'ai.generate.post',
      prompt: 'Write about WordPress',
      providerConfig: { provider: 'anthropic', apiKey: 'sk-ant-test' },
    }, { Authorization: `Bearer ${token}` });
    const genData = await genRes.json();
    assert.equal(genRes.status, 200);
    assert.equal(genData.data.orchestration.type, 'byok');
    assert.equal(genData.data.provider, 'anthropic');
  });
});
