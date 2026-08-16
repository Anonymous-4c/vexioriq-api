import { registerTool } from '../registry.js';

registerTool({
  id: 'hash-generator',
  name: 'Hash Generator',
  slug: 'hash-generator',
  description: 'Generate SHA-256, SHA-384, or SHA-512 hashes of input text',
  version: '1.0.0',
  category: 'developer',
  method: 'POST',
  access: 'free',
  requiredScopes: ['tools:execute'],
  rateLimitTier: 'authenticated',
  inputSchema: {
    required: ['input'],
    properties: {
      input: { type: 'string', maxLength: 100000 },
      algorithm: { type: 'string' },
    },
  },
  examples: [
    { input: { input: 'hello', algorithm: 'SHA-256' }, output: { hash: '...' } },
  ],
  tags: ['hash', 'sha256', 'sha512', 'crypto'],
  execute: async (body) => {
    const algorithms = ['SHA-256', 'SHA-384', 'SHA-512'];
    const algorithm = algorithms.includes(body.algorithm) ? body.algorithm : 'SHA-256';
    const encoder = new TextEncoder();
    const data = encoder.encode(body.input);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = new Uint8Array(hashBuffer);
    const hash = Array.from(hashArray, (b) => b.toString(16).padStart(2, '0')).join('');
    return { hash, algorithm, inputLength: body.input.length };
  },
});
