import { registerTool } from '../registry.js';

registerTool({
  id: 'uuid-generator',
  name: 'UUID Generator',
  slug: 'uuid-generator',
  description: 'Generate random UUID v4 identifiers',
  version: '1.0.0',
  category: 'developer',
  method: 'POST',
  access: 'free',
  requiredScopes: ['tools:execute'],
  rateLimitTier: 'authenticated',
  inputSchema: {
    properties: {
      count: { type: 'number', maxLength: 100 },
    },
  },
  examples: [
    { input: { count: 5 }, output: { uuids: ['...', '...'] } },
  ],
  tags: ['uuid', 'id', 'generator'],
  execute: async (body) => {
    const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 100);
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());
    return { uuids, count };
  },
});
