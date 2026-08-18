import { verifyCredential } from './credentials.js';
import { verifySession } from './sessions.js';
import { verifyInstallation } from './installations.js';
import { store } from './storage.js';
import { auditLog } from './audit.js';
import { ApiError } from '../utils/errors.js';
import { extractBearerToken } from '../utils/request.js';

export async function pluginAuth(request, env) {
  const token = extractBearerToken(request);
  if (!token) {
    throw ApiError.unauthorized('Missing authorization credential');
  }

  let credential;
  if (token.startsWith('vx_live_')) {
    credential = await verifyCredential(token, env);
    if (!credential) {
      await auditLog('authorization_failed', {
        metadata: { reason: 'invalid_credential' },
        ip: request.headers.get('x-forwarded-for'),
      });
      throw ApiError.unauthorized('Invalid or revoked credential');
    }
  } else if (token.length === 64) {
    const session = await verifySession(token, env);
    if (!session) {
      await auditLog('authorization_failed', {
        metadata: { reason: 'invalid_session' },
        ip: request.headers.get('x-forwarded-for'),
      });
      throw ApiError.unauthorized('Invalid or expired session');
    }
    return { type: 'session', session, credential: null, installation: null };
  } else {
    throw ApiError.unauthorized('Invalid credential format');
  }

  if (!credential || credential.status !== 'active') {
    throw ApiError.unauthorized('Credential is not active');
  }

  const entitlement = await store.entitlements.get(`ent:${credential.accountId}:${credential.productId}`);
  if (!entitlement || entitlement.status !== 'active') {
    await auditLog('authorization_failed', {
      accountId: credential.accountId,
      credentialId: credential.id,
      metadata: { reason: 'no_entitlement' },
    });
    throw ApiError.forbidden('Product not entitled');
  }

  return { type: 'credential', credential, entitlement, session: null, installation: null };
}

export async function requireInstallation(authResult, installationId) {
  if (!installationId) {
    throw ApiError.badRequest('Installation ID required');
  }

  const accountId = authResult.credential?.accountId || authResult.session?.accountId;
  const installation = await verifyInstallation(installationId, accountId);
  if (!installation) {
    await auditLog('authorization_failed', {
      accountId,
      credentialId: authResult.credential?.id,
      metadata: { reason: 'installation_not_linked', installationId },
    });
    throw ApiError.forbidden('Installation not linked or revoked');
  }

  authResult.installation = installation;
  return authResult;
}

export async function requireSessionAuth(request, env) {
  const token = extractBearerToken(request);
  if (!token) {
    throw ApiError.unauthorized('Missing session token');
  }

  const session = await verifySession(token, env);
  if (!session) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  return session;
}
