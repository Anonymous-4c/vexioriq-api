import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../src/router/router.js';

describe('Router', () => {
  it('matches exact GET routes', () => {
    const router = createRouter();
    router.get('/v1/health', () => 'ok');
    const match = router.match('GET', '/v1/health');
    assert.ok(match);
    assert.equal(typeof match.handler, 'function');
  });

  it('extracts path parameters', () => {
    const router = createRouter();
    router.get('/v1/tools/:tool', () => 'tool');
    const match = router.match('GET', '/v1/tools/uuid-generator');
    assert.ok(match);
    assert.equal(match.params.tool, 'uuid-generator');
  });

  it('returns null for unmatched routes', () => {
    const router = createRouter();
    router.get('/v1/health', () => 'ok');
    const match = router.match('GET', '/v1/unknown');
    assert.equal(match, null);
  });

  it('returns null for wrong HTTP method', () => {
    const router = createRouter();
    router.get('/v1/health', () => 'ok');
    const match = router.match('POST', '/v1/health');
    assert.equal(match, null);
  });

  it('handles multiple params', () => {
    const router = createRouter();
    router.get('/v1/:version/tools/:tool', () => 'ok');
    const match = router.match('GET', '/v1/v1/tools/json-formatter');
    assert.ok(match);
    assert.equal(match.params.version, 'v1');
    assert.equal(match.params.tool, 'json-formatter');
  });

  it('registers different methods', () => {
    const router = createRouter();
    router.get('/test', () => 'get');
    router.post('/test', () => 'post');
    router.delete('/test', () => 'delete');
    assert.ok(router.match('GET', '/test'));
    assert.ok(router.match('POST', '/test'));
    assert.ok(router.match('DELETE', '/test'));
    assert.equal(router.match('PUT', '/test'), null);
  });
});
