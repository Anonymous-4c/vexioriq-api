import { registerTool } from '../registry.js';

registerTool({
  id: 'json-formatter',
  name: 'JSON Formatter',
  slug: 'json-formatter',
  description: 'Format, minify, or validate JSON input',
  version: '1.0.0',
  category: 'text',
  method: 'POST',
  access: 'free',
  requiredScopes: ['tools:execute'],
  rateLimitTier: 'authenticated',
  inputSchema: {
    required: ['input'],
    properties: {
      input: { type: 'string', maxLength: 1000000 },
      indent: { type: 'number' },
      mode: { type: 'string' },
    },
  },
  examples: [
    { input: { input: '{"a":1}', mode: 'format' }, output: { formatted: '{\n  "a": 1\n}' } },
  ],
  tags: ['json', 'format', 'validate', 'minify'],
  execute: async (body) => {
    let parsed;
    try {
      parsed = JSON.parse(body.input);
    } catch (e) {
      return { valid: false, error: e.message };
    }

    const mode = body.mode || 'format';
    const indent = body.indent || 2;

    if (mode === 'minify') {
      return { valid: true, formatted: JSON.stringify(parsed) };
    }
    if (mode === 'validate') {
      return { valid: true };
    }
    return { valid: true, formatted: JSON.stringify(parsed, null, indent) };
  },
});
