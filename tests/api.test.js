import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  const url = `https://api.vexioriq.com${path}`;
  const opts = { method, headers: { ...headers } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  return worker.fetch(new Request(url, opts), {}, {});
}

function parseJson(response) {
  return response.json();
}

describe('Health Endpoint', () => {
  it('GET /v1/health returns ok status', async () => {
    const res = await makeRequest('/v1/health');
    const data = await parseJson(res);
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.status, 'ok');
    assert.equal(data.data.service, 'vexioriq-api');
    assert.equal(data.data.version, 'v1');
  });

  it('GET /health returns 404', async () => {
    const res = await makeRequest('/health');
    assert.equal(res.status, 404);
  });
});

describe('Meta Endpoint', () => {
  it('GET /v1/meta returns service metadata', async () => {
    const res = await makeRequest('/v1/meta');
    const data = await parseJson(res);
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.service, 'Vexioriq API');
    assert.equal(data.data.version, 'v1');
    assert.ok(Array.isArray(data.data.supportedVersions));
    assert.ok(data.data.website);
  });
});

describe('404 Handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await makeRequest('/v1/nonexistent');
    const data = await parseJson(res);
    assert.equal(res.status, 404);
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'NOT_FOUND');
  });

  it('returns API tester HTML for root path', async () => {
    const res = await makeRequest('/');
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Vexioriq API Tester'));
  });
});

describe('Unsupported HTTP Methods', () => {
  it('returns 405 for unsupported methods on known routes', async () => {
    const res = await makeRequest('/v1/health', 'PATCH');
    assert.equal(res.status, 405);
  });

  it('returns 405 for PUT on health', async () => {
    const res = await makeRequest('/v1/health', 'PUT');
    assert.equal(res.status, 405);
  });
});

describe('CORS', () => {
  it('handles OPTIONS preflight request', async () => {
    const res = await makeRequest('/v1/health', 'OPTIONS', null, {
      Origin: 'https://vexioriq.com',
      'Access-Control-Request-Method': 'GET',
    });
    assert.equal(res.status, 204);
    assert.ok(res.headers.get('Access-Control-Allow-Origin'));
    assert.ok(res.headers.get('Access-Control-Allow-Methods'));
    assert.ok(res.headers.get('Access-Control-Allow-Headers'));
  });
});

describe('Error Format', () => {
  it('returns consistent error structure', async () => {
    const res = await makeRequest('/v1/nonexistent');
    const data = await parseJson(res);
    assert.equal(data.success, false);
    assert.ok(data.error);
    assert.ok(data.error.code);
    assert.ok(data.error.message);
  });

  it('includes X-Request-ID header', async () => {
    const res = await makeRequest('/v1/health');
    assert.ok(res.headers.get('X-Request-ID'));
  });
});

describe('Security Headers', () => {
  it('includes security headers in responses', async () => {
    const res = await makeRequest('/v1/health');
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(res.headers.get('X-Frame-Options'), 'DENY');
    assert.ok(res.headers.get('Referrer-Policy'));
  });
});
