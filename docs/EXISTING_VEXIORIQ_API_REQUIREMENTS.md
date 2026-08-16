# Existing Vexioriq API Requirements

Analysis of the existing Vexioriq frontend (Vercel) and what the API needs to support.

## Existing Frontend Architecture

- **Framework:** Next.js (Pages Router)
- **Database:** MongoDB
- **Auth:** Custom JWT (jose library), HttpOnly cookies
- **Payments:** Creem (Merchant of Record)
- **Hosting:** Vercel

## Tool Inventory

### Client-Side Tools (no API needed)

| Tool | Category | Notes |
|------|----------|-------|
| JSON Formatter | text | Monaco Editor, browser-only |
| Regex Tester | developer | Monaco Editor, browser-only |
| UUID Generator | developer | browser crypto API |
| Base64 Encoder | developer | btoa/atob |
| Timestamp Converter | converters | Date API |
| QR Generator | images | client-side library |
| Color Converter | converters | pure computation |
| Markdown Preview | text | client-side rendering |
| Text Diff | text | client-side comparison |
| CSS Gradient | text | client-side builder |
| JWT Decoder | developer | client-side decode |

### Premium Client-Side Tools

| Tool | Category | Notes |
|------|----------|-------|
| API Tester | developer | browser fetch(), premium-gated |
| Hash Generator | developer | Web Crypto API, premium-gated |

### Server-Side Tool (requires backend)

| Tool | Category | Notes |
|------|----------|-------|
| Codebase X-Ray | developer | ZIP upload, AST analysis, MongoDB storage |

## API Needs for the Cloudflare Worker

### 1. Tool Discovery API

The Vexioriq website currently hardcodes tool data in `src/data/tools.ts`. The API should provide:

```
GET /v1/tools        → list all tools with metadata
GET /v1/tools/:slug  → single tool metadata
```

This allows the frontend to consume tool definitions from the API.

### 2. Tool Execution API

For developer API consumers who want to use tools programmatically:

```
POST /v1/tools/:slug → execute a tool with input
```

Only tools that make sense as APIs should be exposed. Client-side-only tools can still be exposed for programmatic use.

### 3. API Key Infrastructure

The existing frontend has no API key system. The Vercel app handles user auth (JWT cookies). The API Worker needs its own API key system for developer access.

### 4. Rate Limiting

The existing frontend has zero rate limiting. The API must protect itself.

## What Should NOT Move to the API

| Responsibility | Stays on Vercel | Reason |
|---|---|---|
| User signup/login | Yes | Part of app UX |
| Session management | Yes | Tied to cookies/JWT |
| Checkout/billing | Yes | Tied to Creem SDK |
| Subscription mgmt | Yes | Part of dashboard |
| Codebase X-Ray upload | Yes | Requires MongoDB + Babel |
| Dashboard rendering | Yes | Server-rendered pages |
| Webhook handling | Yes | Creem integration |

## What the API Should Own

| Responsibility | Cloudflare Worker | Reason |
|---|---|---|
| API key verification | Yes | Independent auth layer |
| Tool discovery | Yes | Public developer API |
| Tool execution | Yes | Stateless computation |
| Rate limiting | Yes | API protection |
| Usage tracking | Yes | For API consumers |

## Plan Tiers (from frontend)

| Plan | Limits |
|------|--------|
| Free | 1 project, 5MB, 10 saved tools |
| Pro ($11.99/mo) | 10 projects, 25MB, 10K API calls |
| Business ($23.99/mo) | Unlimited everything |

The API should support tier-based rate limiting but not own subscription logic.

## Environment Variables (names only)

```
DATABASE_URL_MONGODB_URI
DATABASE_NAME
AUTH_SECRET
AUTH_URL
APP_URL
NEXT_PUBLIC_APP_URL
PAYMENT_PROVIDER
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
CREEM_ENV
```

None of these should be in the Cloudflare Worker except as needed for future integration.
