import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateApiKey, extractKeyPrefix, hashApiKey } from '../src/auth/apiKeys.js';

describe('API Key Utilities', () => {
  it('generates key with vxr_ prefix', () => {
    const key = generateApiKey();
    assert.ok(key.startsWith('vxr_'));
    assert.ok(key.length > 10);
  });

  it('generates unique keys', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    assert.notEqual(key1, key2);
  });

  it('extracts key prefix', () => {
    const key = generateApiKey();
    const prefix = extractKeyPrefix(key);
    assert.ok(prefix.startsWith('vxr_'));
    assert.ok(prefix.length > 4);
  });

  it('returns null for invalid prefix', () => {
    assert.equal(extractKeyPrefix('invalid_key'), null);
    assert.equal(extractKeyPrefix(null), null);
    assert.equal(extractKeyPrefix(''), null);
  });

  it('produces consistent HMAC hashes', async () => {
    const key = 'vxr_test1234567890abcdef';
    const secret = 'test-secret';
    const hash1 = await hashApiKey(key, secret);
    const hash2 = await hashApiKey(key, secret);
    assert.equal(hash1, hash2);
    assert.ok(hash1.length > 0);
  });

  it('produces different hashes with different secrets', async () => {
    const key = 'vxr_test1234567890abcdef';
    const hash1 = await hashApiKey(key, 'secret1');
    const hash2 = await hashApiKey(key, 'secret2');
    assert.notEqual(hash1, hash2);
  });
});
