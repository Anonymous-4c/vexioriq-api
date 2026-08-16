import { registerTool } from '../registry.js';

registerTool({
  id: 'base64-encoder',
  name: 'Base64 Encoder/Decoder',
  slug: 'base64-encoder',
  description: 'Encode or decode Base64 strings',
  version: '1.0.0',
  category: 'developer',
  method: 'POST',
  access: 'free',
  requiredScopes: ['tools:execute'],
  rateLimitTier: 'authenticated',
  inputSchema: {
    required: ['input'],
    properties: {
      input: { type: 'string', maxLength: 1000000 },
      mode: { type: 'string' },
    },
  },
  examples: [
    { input: { input: 'hello', mode: 'encode' }, output: { result: 'aGVsbG8=' } },
  ],
  tags: ['base64', 'encode', 'decode'],
  execute: async (body) => {
    const mode = body.mode || 'encode';
    try {
      if (mode === 'decode') {
        const decoded = atob(body.input);
        return { result: decoded, mode: 'decode' };
      }
      const encoded = btoa(body.input);
      return { result: encoded, mode: 'encode' };
    } catch (e) {
      return { error: 'Invalid input for ' + mode, mode };
    }
  },
});
