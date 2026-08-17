import { ApiError } from '../utils/errors.js';
import { extractBearerToken } from '../utils/request.js';
import { verifyApiKey } from '../auth/apiKeys.js';
import { config } from '../config/config.js';

export async function authenticationMiddleware(request, env) {
  const token = extractBearerToken(request);

  if (!token) {
    return { authenticated: false, tier: 'anonymous', keyContext: null };
  }

  if (!token.startsWith(config.apiKey.prefix)) {
    throw ApiError.unauthorized('Invalid API key format');
  }

  const keyRecord = await verifyApiKey(token, env);
  if (!keyRecord) {
    throw ApiError.unauthorized('Invalid or revoked API key');
  }

  if (keyRecord.revokedAt) {
    throw ApiError.forbidden('API key has been revoked');
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    throw ApiError.forbidden('API key has expired');
  }

  const plan = keyRecord.plan || 'free';

  return {
    authenticated: true,
    tier: plan,
    keyContext: {
      id: keyRecord.id,
      prefix: keyRecord.keyPrefix,
      name: keyRecord.name,
      scopes: keyRecord.scopes || [],
      plan,
      createdAt: keyRecord.createdAt,
      lastUsedAt: keyRecord.lastUsedAt,
    },
  };
}

export function requireScope(requiredScopes) {
  return (authContext) => {
    if (!authContext.authenticated) {
      throw ApiError.unauthorized();
    }
    const scopes = authContext.keyContext.scopes;
    const hasAll = requiredScopes.every((s) => scopes.includes(s));
    if (!hasAll) {
      throw ApiError.forbidden('Insufficient permissions');
    }
  };
}
