# Vexioriq API — WordPress AI Studio Plugin Integration

## Overview

The Vexioriq API provides server-side authorization and orchestration infrastructure for the WordPress AI Studio plugin. The API is the authoritative security boundary — the plugin cannot access protected functionality without valid server-side authorization.

## Architecture

```
WordPress Plugin
       │
       │ Authorization
       ▼
Vexioriq API (api.vexioriq.com)
       │
       ├── Credential Verification
       ├── Entitlement Check
       ├── Installation Verification
       ├── Session Authorization
       ├── Capability Check
       ├── Resource Authorization
       └── Audit Logging
```

## Authentication

### API Credentials (vx_live_)

Credentials use format: `vx_live_<public_id>_<secret>`

- `public_id`: 16 hex chars, used for lookup
- `secret`: 48 hex chars, cryptographic random
- Only HMAC-SHA-256 hash of secret is stored server-side

**Header:** `Authorization: Bearer vx_live_...`

### Session Tokens

After credential verification + installation linking, the API issues session tokens (64 hex chars).

**Header:** `Authorization: Bearer <session_token>`

---

## Endpoints

### Base URL

```
https://api.vexioriq.com/v1/plugin
```

---

### POST /v1/plugin/link/initiate

Initiate account linking between WordPress installation and Vexioriq account.

**Auth:** API Credential (`vx_live_`)

**Request:**
```json
{
  "productId": "wp-ai-studio",
  "domain": "https://example.com",
  "fingerprint": "fp_abc123..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "token": "link_token_hex",
    "expiresAt": "2026-08-17T00:10:00.000Z",
    "status": "pending"
  }
}
```

**Errors:**
- `401` — Invalid or missing credential
- `400` — Invalid product

---

### POST /v1/plugin/link/complete

Complete installation linking after user authenticates on Vexioriq website.

**Auth:** API Credential (`vx_live_`)

**Request:**
```json
{
  "token": "link_token_hex",
  "fingerprint": "fp_abc123...",
  "domain": "https://example.com",
  "pluginVersion": "1.0.0",
  "wpVersion": "6.5",
  "phpVersion": "8.2"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "installationId": "uuid",
    "status": "active",
    "productId": "wp-ai-studio"
  }
}
```

**Errors:**
- `400` — Invalid/expired token
- `403` — Token belongs to different account
- `409` — Token already used

---

### POST /v1/plugin/credentials

Create a new API credential for a product.

**Auth:** API Credential (`vx_live_`)

**Request:**
```json
{
  "productId": "wp-ai-studio",
  "name": "My WordPress Site"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "credential": {
      "id": "uuid",
      "publicId": "hex16",
      "name": "My WordPress Site",
      "productId": "wp-ai-studio",
      "createdAt": "2026-08-16T..."
    },
    "apiKey": "vx_live_..."
  }
}
```

**Important:** The `apiKey` is shown only once. Store it securely.

---

### GET /v1/plugin/credentials

List all credentials for the authenticated account.

**Auth:** API Credential (`vx_live_`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "credentials": [
      {
        "id": "uuid",
        "publicId": "hex",
        "name": "My Key",
        "productId": "wp-ai-studio",
        "status": "active",
        "createdAt": "...",
        "lastUsedAt": "...",
        "revokedAt": null
      }
    ]
  }
}
```

---

### POST /v1/plugin/credentials/:credentialId/revoke

Revoke an API credential.

**Auth:** API Credential (`vx_live_`)

**Response (200):**
```json
{
  "success": true,
  "data": { "revoked": true }
}
```

---

### POST /v1/plugin/session

Create a session after credential + installation verification.

**Auth:** API Credential (`vx_live_`)

**Request:**
```json
{
  "installationId": "uuid",
  "fingerprint": "fp_abc123..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "session": {
      "token": "64hexchars",
      "expiresAt": "2026-08-17T...",
      "capabilities": [
        "ai.generate.post",
        "ai.generate.page",
        "ai.generate.pattern",
        "ai.generate.widget",
        "ai.generate.template",
        "architecture.analyze",
        "architecture.generate",
        "resource.patterns",
        "resource.templates"
      ],
      "installationId": "uuid",
      "productId": "wp-ai-studio"
    }
  }
}
```

---

### GET /v1/plugin/session

Verify an active session.

**Auth:** Session Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "accountId": "...",
      "productId": "wp-ai-studio",
      "installationId": "uuid",
      "capabilities": [...],
      "expiresAt": "...",
      "lastAccessedAt": "..."
    }
  }
}
```

---

### POST /v1/plugin/generate

Request AI content generation through Vexioriq orchestration.

**Auth:** Session Token

**Request:**
```json
{
  "capability": "ai.generate.post",
  "prompt": "Write a blog post about WordPress security",
  "context": {
    "tone": "professional",
    "length": "medium"
  },
  "providerConfig": {
    "provider": "openai",
    "apiKey": "sk-user-own-key",
    "model": "gpt-4o"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resourceToken": "ra_hex...",
    "provider": "openai",
    "model": "gpt-4o",
    "orchestration": {
      "type": "byok",
      "endpoint": "https://api.openai.com/v1",
      "instructions": "Use the user's openai credentials...",
      "capabilities": ["ai.generate.post", "ai.generate.page"]
    },
    "prompt": "Write a blog post...",
    "context": { "tone": "professional" }
  }
}
```

**Supported Providers:** `openai`, `anthropic`, `google`, `xai`

---

### GET /v1/plugin/resource/:resourceToken

Access a protected resource with server-issued authorization.

**Auth:** Session Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "scope": "ai.generate.post",
    "type": "generation"
  }
}
```

---

### GET /v1/plugin/installations

List all installations for the account.

**Auth:** API Credential (`vx_live_`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "installations": [
      {
        "id": "uuid",
        "productId": "wp-ai-studio",
        "domain": "https://example.com",
        "status": "active",
        "pluginVersion": "1.0.0",
        "wpVersion": "6.5",
        "createdAt": "...",
        "lastSeenAt": "...",
        "revokedAt": null
      }
    ]
  }
}
```

---

### POST /v1/plugin/installations/:installationId/revoke

Revoke an installation (disconnect WordPress site).

**Auth:** API Credential (`vx_live_`)

**Response (200):**
```json
{
  "success": true,
  "data": { "revoked": true }
}
```

---

## Capability Model

Capabilities are determined server-side based on product entitlement:

| Capability | Description |
|---|---|
| `ai.generate.post` | Generate WordPress posts |
| `ai.generate.page` | Generate WordPress pages |
| `ai.generate.pattern` | Generate WordPress patterns |
| `ai.generate.widget` | Generate widgets/components |
| `ai.generate.template` | Generate templates |
| `architecture.analyze` | Analyze site architecture |
| `architecture.generate` | Generate architecture |
| `resource.patterns` | Access pattern resources |
| `resource.templates` | Access template resources |

The API determines capabilities — never trust client-provided capability lists.

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_CREDENTIAL` | 401 | Credential not found or invalid |
| `CREDENTIAL_REVOKED` | 401 | Credential has been revoked |
| `PRODUCT_NOT_ENTITLED` | 403 | Account lacks product entitlement |
| `INSTALLATION_NOT_LINKED` | 403 | Installation not registered |
| `INSTALLATION_REVOKED` | 403 | Installation has been revoked |
| `SESSION_EXPIRED` | 401 | Session has expired |
| `CAPABILITY_NOT_ALLOWED` | 403 | Capability not authorized |
| `RESOURCE_NOT_AUTHORIZED` | 403 | Resource access not authorized |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INVALID_LINK_TRANSACTION` | 400 | Link token invalid/expired |

---

## Rate Limits

| Operation | Limit | Window |
|---|---|---|
| `session.create` | 10 req | 60s |
| `session.verify` | 100 req | 60s |
| `credential.verify` | 100 req | 60s |
| `resource.access` | 50 req | 60s |
| `link.create` | 5 req | 60s |
| `link.complete` | 10 req | 60s |

---

## Security Model

1. **API is the authority** — Plugin cannot self-authorize
2. **Credentials are opaque** — No PII in keys
3. **Secrets are hashed** — Only HMAC-SHA-256 stored
4. **Sessions expire** — 24 hour TTL
5. **Resource auth is short-lived** — 5 minute TTL, 10 max uses
6. **Revocation is immediate** — Server-side state changes invalidate all related tokens
7. **Audit logging** — All security events logged without secrets

---

## Plugin Flow

```
1. Plugin calls POST /v1/plugin/link/initiate (with API credential)
2. User authenticates on vexioriq.com and approves
3. Plugin calls POST /v1/plugin/link/complete (with link token)
4. Plugin calls POST /v1/plugin/session (with credential + installation)
5. Plugin uses session token for all subsequent requests
6. Plugin calls POST /v1/plugin/generate (with session + provider config)
7. Vexioriq returns orchestration instructions
8. Plugin uses user's AI provider directly with orchestration guidance
```

---

## BYOK Architecture

The customer provides their own AI provider credentials. Vexioriq never stores them long-term. The flow:

1. User enters their AI API key in WordPress plugin settings
2. Plugin sends provider config with generation requests
3. Vexioriq provides orchestration/instructions
4. Plugin makes AI provider calls using user's credentials
5. Vexioriq validates/transforms results

**Supported Providers:** OpenAI, Anthropic, Google Gemini, xAI Grok

---

## Installation Fingerprint

Each WordPress installation has a unique fingerprint (32 hex chars) generated during plugin installation. This fingerprint:

- Identifies the installation server-side
- Is used for session creation
- Is bound to the account/product
- Cannot be transferred without re-linking

---

## Revocation

Server-side revocation is immediate:

- **Credential revoked** → All sessions using it are invalidated
- **Installation revoked** → All sessions for that installation are invalidated
- **Entitlement changed** → Capabilities are recalculated on next session

The plugin does not need to update itself to enforce revocation.
