import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listTools, getToolBySlug, getToolMetadata } from '../src/tools/registry.js';
import '../src/tools/index.js';

describe('Tool Registry', () => {
  it('lists registered tools', () => {
    const tools = listTools();
    assert.ok(tools.length > 0);
    assert.ok(tools.every((t) => t.id && t.name && t.execute === undefined));
  });

  it('finds tool by slug', () => {
    const tool = getToolBySlug('uuid-generator');
    assert.ok(tool);
    assert.equal(tool.id, 'uuid-generator');
    assert.equal(tool.name, 'UUID Generator');
  });

  it('returns null for unknown tool', () => {
    const tool = getToolBySlug('nonexistent-tool');
    assert.equal(tool, null);
  });

  it('returns metadata without execute function', () => {
    const meta = getToolMetadata('hash-generator');
    assert.ok(meta);
    assert.equal(meta.id, 'hash-generator');
    assert.equal(meta.execute, undefined);
  });

  it('filters by category', () => {
    const devTools = listTools({ category: 'developer' });
    assert.ok(devTools.length > 0);
    assert.ok(devTools.every((t) => t.category === 'developer'));
  });

  it('filters by access', () => {
    const freeTools = listTools({ access: 'free' });
    assert.ok(freeTools.length > 0);
    assert.ok(freeTools.every((t) => t.access === 'free'));
  });
});

describe('Tool Execution', () => {
  it('uuid-generator produces valid UUIDs', async () => {
    const tool = getToolBySlug('uuid-generator');
    const result = await tool.execute({ count: 3 });
    assert.equal(result.uuids.length, 3);
    assert.ok(result.uuids.every((u) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(u)));
  });

  it('hash-generator produces SHA-256 hash', async () => {
    const tool = getToolBySlug('hash-generator');
    const result = await tool.execute({ input: 'hello' });
    assert.ok(result.hash);
    assert.equal(result.hash.length, 64);
    assert.equal(result.algorithm, 'SHA-256');
  });

  it('json-formatter formats JSON', async () => {
    const tool = getToolBySlug('json-formatter');
    const result = await tool.execute({ input: '{"a":1}', mode: 'format' });
    assert.equal(result.valid, true);
    assert.ok(result.formatted.includes('\n'));
  });

  it('json-formatter validates invalid JSON', async () => {
    const tool = getToolBySlug('json-formatter');
    const result = await tool.execute({ input: 'not json' });
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('base64-encoder encodes correctly', async () => {
    const tool = getToolBySlug('base64-encoder');
    const result = await tool.execute({ input: 'hello', mode: 'encode' });
    assert.equal(result.result, 'aGVsbG8=');
  });

  it('base64-encoder decodes correctly', async () => {
    const tool = getToolBySlug('base64-encoder');
    const result = await tool.execute({ input: 'aGVsbG8=', mode: 'decode' });
    assert.equal(result.result, 'hello');
  });

  it('timestamp-converter returns current time', async () => {
    const tool = getToolBySlug('timestamp-converter');
    const result = await tool.execute({});
    assert.ok(result.timestamp);
    assert.ok(result.date);
  });
});
