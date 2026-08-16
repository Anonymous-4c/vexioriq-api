import { registerTool } from '../registry.js';

registerTool({
  id: 'timestamp-converter',
  name: 'Timestamp Converter',
  slug: 'timestamp-converter',
  description: 'Convert between Unix timestamps and human-readable dates',
  version: '1.0.0',
  category: 'converters',
  method: 'POST',
  access: 'free',
  requiredScopes: ['tools:execute'],
  rateLimitTier: 'authenticated',
  inputSchema: {
    properties: {
      timestamp: { type: 'string' },
      date: { type: 'string' },
    },
  },
  examples: [
    { input: { timestamp: '1700000000' }, output: { date: '2023-11-14T...' } },
  ],
  tags: ['timestamp', 'date', 'unix', 'converter'],
  execute: async (body) => {
    if (body.timestamp) {
      const ts = parseInt(body.timestamp, 10);
      if (isNaN(ts)) return { error: 'Invalid timestamp' };
      const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
      return {
        timestamp: ts,
        date: date.toISOString(),
        utc: date.toUTCString(),
        relative: date.toLocaleString(),
      };
    }
    if (body.date) {
      const date = new Date(body.date);
      if (isNaN(date.getTime())) return { error: 'Invalid date string' };
      return {
        timestamp: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime(),
        iso: date.toISOString(),
        utc: date.toUTCString(),
      };
    }
    const now = Math.floor(Date.now() / 1000);
    return {
      timestamp: now,
      date: new Date().toISOString(),
      utc: new Date().toUTCString(),
    };
  },
});
