# Vexioriq API

Developer API platform for Vexioriq, built on Cloudflare Workers.

**Production URL:** `https://api.vexioriq.com`
**Frontend:** `https://vexioriq.com` (separate Vercel deployment)

## Quick Start

```bash
npm install
npm run dev
```

The Worker starts locally at `http://localhost:8787`.

### Test Endpoints

```bash
curl http://localhost:8787/v1/health
curl http://localhost:8787/v1/meta
curl http://localhost:8787/v1/tools
```

## Project Structure

```
vexioriq-api/
├── src/
│   ├── index.js              # Worker entry point
│   ├── router/router.js      # URL pattern matcher
│   ├── middleware/            # CORS, auth, rate limit, etc.
│   ├── api/v1/               # Versioned API endpoints
│   ├── tools/                # Tool registry + implementations
│   ├── auth/                 # API key infrastructure
│   ├── config/config.js      # Centralized configuration
│   └── utils/                # Response helpers, errors, IDs
├── tests/
├── docs/
├── wrangler.jsonc
└── package.json
```

## API Versioning

All endpoints are versioned under `/v1/`:

```
GET  /v1/health       → Health check
GET  /v1/meta         → API metadata
GET  /v1/tools        → List all tools
GET  /v1/tools/:slug  → Tool metadata
POST /v1/tools/:slug  → Execute tool
```

## API Key Authentication

Generate a key:

```js
import { generateApiKey } from './src/auth/apiKeys.js';
const { apiKey } = await generateApiKey();
```

Use it:

```bash
curl -H "Authorization: Bearer vxr_..." https://api.vexioriq.com/v1/tools
```

Keys use format: `vxr_<random-hex>`

Keys are stored as HMAC-SHA-256 hashes — plaintext is never persisted.

## Adding a New Tool

1. Create a file in `src/tools/free/` or `src/tools/premium/`:

```js
import { registerTool } from '../registry.js';

registerTool({
  id: 'my-tool',
  name: 'My Tool',
  slug: 'my-tool',
  description: 'Does something useful',
  category: 'developer',
  method: 'POST',
  access: 'free',
  inputSchema: {
    required: ['input'],
    properties: {
      input: { type: 'string', maxLength: 10000 },
    },
  },
  execute: async (body, env) => {
    return { result: body.input.toUpperCase() };
  },
});
```

2. Import it in `src/tools/index.js`:

```js
import './free/my-tool.js';
```

3. Restart the dev server.

## Environment Variables

Copy `.dev.vars.example` to `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
```

| Variable | Description |
|---|---|
| `API_KEY_HMAC_SECRET` | Secret for hashing API keys |
| `INTERNAL_SYNC_SECRET` | Server-to-server sync credential |
| `CORS_ORIGINS` | Additional CORS origins (comma-separated) |

## Deployment

```bash
npm run deploy
```

### Custom Domain

1. Add `api.vexioriq.com` as a route in `wrangler.jsonc`
2. Configure DNS in Cloudflare: CNAME or A record pointing to the Worker
3. Deploy with `npm run deploy`

## Testing

```bash
npm test
```

## Architecture

```
Request → CORS → Security Headers → Auth → Rate Limit → Router → Handler → Response
```

- **Stateless** — no persistent processes
- **$0 hosting** — Cloudflare free tier
- **Tool isolation** — tools don't know about routing or auth
- **Extensible** — add tools by registering them, no restructuring needed
