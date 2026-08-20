import { ApiError } from '../../utils/errors.js';
import { successResponse } from '../../utils/response.js';
import { createLinkTransaction, getLinkTransaction, completeLinkTransaction } from '../../plugin/linking.js';
import { createInstallation, verifyInstallation, verifyInstallationByFingerprint, revokeInstallation, listInstallationsByAccount } from '../../plugin/installations.js';
import { createCredential, revokeCredential, listCredentialsByAccount } from '../../plugin/credentials.js';
import { createSession } from '../../plugin/sessions.js';
import { store } from '../../plugin/storage.js';
import { PRODUCTS } from '../../plugin/products.js';
import { AI_PROVIDERS, getProvider } from '../../plugin/providers.js';
import { auditLog } from '../../plugin/audit.js';
import { pluginAuth, requireInstallation } from '../../plugin/middleware.js';
import { pluginRateLimit } from '../../plugin/rateLimit.js';
import { generateContent } from '../../plugin/orchestration.js';
import { verifyResourceAuth } from '../../plugin/resourceAuth.js';

export async function initiateLinkHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'link.create');

  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required for linking');
  }

  const body = await request.json().catch(() => ({}));
  const productId = body.productId || 'wp-ai-studio';
  const domain = body.domain || null;
  const fingerprint = body.fingerprint || null;

  if (!PRODUCTS[productId]) {
    throw ApiError.badRequest('Invalid product');
  }

  const transaction = await createLinkTransaction(auth.credential.accountId, productId, {
    domain,
    fingerprint,
  });

  await auditLog('link_initiated', {
    accountId: auth.credential.accountId,
    credentialId: auth.credential.id,
    metadata: { productId, domain },
  });

  return successResponse({
    transactionId: transaction.id,
    token: transaction.token,
    expiresAt: transaction.expiresAt,
    status: transaction.status,
  }, 201);
}

export async function completeLinkHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'link.complete');

  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const body = await request.json().catch(() => ({}));
  const { token, fingerprint, domain, pluginVersion, wpVersion, phpVersion } = body;

  if (!token) {
    throw ApiError.badRequest('Link token required');
  }

  const transaction = await getLinkTransaction(token);
  if (!transaction) {
    throw ApiError.badRequest('Invalid link token');
  }

  if (transaction.accountId !== auth.credential.accountId) {
    throw ApiError.forbidden('Token does not belong to this account');
  }

  if (transaction.status !== 'pending') {
    throw ApiError.conflict('Link token already used or expired');
  }

  if (new Date(transaction.expiresAt) < new Date()) {
    throw ApiError.badRequest('Link token expired');
  }

  const installation = await createInstallation(
    transaction.accountId,
    transaction.productId,
    { fingerprint, domain, pluginVersion, wpVersion, phpVersion }
  );

  await completeLinkTransaction(token, installation.id);

  return successResponse({
    installationId: installation.id,
    status: installation.status,
    productId: transaction.productId,
  }, 201);
}

export async function createCredentialHandler(request, env, params, authContext) {
  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const body = await request.json().catch(() => ({}));
  const { productId, name } = body;

  if (!productId) {
    throw ApiError.badRequest('Product ID required');
  }

  const result = await createCredential(auth.credential.accountId, productId, name, env);

  return successResponse({
    credential: {
      id: result.credential.id,
      publicId: result.credential.publicId,
      name: result.credential.name,
      productId: result.credential.productId,
      createdAt: result.credential.createdAt,
    },
    apiKey: result.apiKey,
  }, 201);
}

export async function listCredentialsHandler(request, env, params, authContext) {
  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const credentials = await listCredentialsByAccount(auth.credential.accountId);
  const safe = credentials.map(c => ({
    id: c.id,
    publicId: c.publicId,
    name: c.name,
    productId: c.productId,
    status: c.status,
    createdAt: c.createdAt,
    lastUsedAt: c.lastUsedAt,
    revokedAt: c.revokedAt,
  }));

  return successResponse({ credentials: safe });
}

export async function revokeCredentialHandler(request, env, params, authContext) {
  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const credentialId = params.credentialId;
  if (!credentialId) {
    throw ApiError.badRequest('Credential ID required');
  }

  const credential = await store.credentials.get(`cred:${credentialId}`);
  if (!credential) {
    throw ApiError.notFound('Credential not found');
  }

  if (credential.accountId !== auth.credential.accountId) {
    throw ApiError.forbidden('Cannot revoke credentials for other accounts');
  }

  await revokeCredential(credentialId, env);

  return successResponse({ revoked: true });
}

export async function sessionCreateHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'session.create');

  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const body = await request.json().catch(() => ({}));
  const { installationId, fingerprint } = body;

  let installation = null;
  if (installationId) {
    installation = await verifyInstallation(installationId, auth.credential.accountId);
  } else if (fingerprint) {
    installation = await verifyInstallationByFingerprint(fingerprint, auth.credential.accountId);
  } else {
    throw ApiError.badRequest('installationId or fingerprint required');
  }

  if (!installation) {
    throw ApiError.forbidden('Installation not linked. Complete linking first.');
  }

  const session = await createSession(
    auth.credential,
    installation,
    [auth.entitlement],
    env
  );

  return successResponse({
    session: {
      token: session.token,
      expiresAt: session.expiresAt,
      capabilities: session.capabilities,
      installationId: session.installationId,
      productId: session.productId,
    },
  }, 201);
}

export async function sessionVerifyHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'session.verify');

  const { extractBearerToken } = await import('../../utils/request.js');
  const { verifySession: vs } = await import('../../plugin/sessions.js');

  const token = extractBearerToken(request);
  if (!token) {
    throw ApiError.unauthorized('Missing session token');
  }

  const session = await vs(token, env);
  if (!session) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  return successResponse({
    session: {
      id: session.id,
      accountId: session.accountId,
      productId: session.productId,
      installationId: session.installationId,
      capabilities: session.capabilities,
      expiresAt: session.expiresAt,
      lastAccessedAt: session.lastAccessedAt,
    },
  });
}

export async function generateHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'resource.access');

  const { extractBearerToken } = await import('../../utils/request.js');
  const { verifySession: vs } = await import('../../plugin/sessions.js');

  const token = extractBearerToken(request);
  if (!token) {
    throw ApiError.unauthorized('Missing session token');
  }

  const session = await vs(token, env);
  if (!session) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const body = await request.json().catch(() => ({}));
  const { capability, prompt, context, providerConfig } = body;

  if (!capability) throw ApiError.badRequest('capability required');
  if (!prompt) throw ApiError.badRequest('prompt required');
  if (!providerConfig || !providerConfig.provider) throw ApiError.badRequest('providerConfig.provider required');

  const result = await generateContent(session, {
    capability, prompt, context, providerConfig,
  }, env);

  if (!result.success) {
    throw ApiError.forbidden(result.error.message);
  }

  return successResponse(result.data);
}

export async function resourceAccessHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'resource.access');

  const { extractBearerToken } = await import('../../utils/request.js');
  const { verifySession: vs } = await import('../../plugin/sessions.js');

  const token = extractBearerToken(request);
  if (!token) throw ApiError.unauthorized('Missing session token');

  const session = await vs(token, env);
  if (!session) throw ApiError.unauthorized('Invalid or expired session');

  const resourceToken = params.resourceToken;
  if (!resourceToken) throw ApiError.badRequest('Resource token required');

  const auth = await verifyResourceAuth(resourceToken, session.id);
  if (!auth) throw ApiError.forbidden('Invalid or expired resource authorization');

  return successResponse({
    authorized: true,
    scope: auth.resourceScope,
    type: auth.resourceType,
  });
}

export async function installationListHandler(request, env, params, authContext) {
  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const installations = await listInstallationsByAccount(auth.credential.accountId);
  const safe = installations.map(i => ({
    id: i.id,
    productId: i.productId,
    domain: i.domain,
    status: i.status,
    pluginVersion: i.pluginVersion,
    wpVersion: i.wpVersion,
    createdAt: i.createdAt,
    lastSeenAt: i.lastSeenAt,
    revokedAt: i.revokedAt,
  }));

  return successResponse({ installations: safe });
}

export async function installationRevokeHandler(request, env, params, authContext) {
  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const installationId = params.installationId;
  if (!installationId) throw ApiError.badRequest('Installation ID required');

  const installation = await store.installations.get(`inst:${installationId}`);
  if (!installation) throw ApiError.notFound('Installation not found');
  if (installation.accountId !== auth.credential.accountId) {
    throw ApiError.forbidden('Cannot revoke installations for other accounts');
  }

  await revokeInstallation(installationId);

  return successResponse({ revoked: true });
}

export async function listProvidersHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'providers.list');

  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const accountId = auth.credential.accountId;
  const providers = [];

  for (const [providerId, providerDef] of Object.entries(AI_PROVIDERS)) {
    const configKey = `provider_config:${accountId}:${providerId}`;
    const savedConfig = await store.providerConfigs?.get(configKey) || null;

    providers.push({
      id: providerId,
      name: providerDef.name,
      configured: !!savedConfig,
      defaultModel: providerDef.defaultModel,
      models: providerDef.models,
      requiredFields: providerDef.requiredFields,
      optionalFields: providerDef.optionalFields,
      baseUrl: providerDef.baseUrl,
    });
  }

  await auditLog('providers_listed', {
    accountId,
    credentialId: auth.credential.id,
    metadata: { count: providers.length },
  });

  return successResponse({ providers });
}

export async function syncProviderConfigHandler(request, env, params, authContext) {
  pluginRateLimit(request.headers.get('x-forwarded-for') || 'anonymous', 'providers.sync');

  const auth = await pluginAuth(request, env);
  if (auth.type !== 'credential') {
    throw ApiError.unauthorized('API credential required');
  }

  const body = await request.json().catch(() => ({}));
  const { providerId, config } = body;

  if (!providerId) throw ApiError.badRequest('providerId required');

  const providerDef = getProvider(providerId);
  if (!providerDef) throw ApiError.badRequest(`Unknown provider: ${providerId}`);

  for (const field of providerDef.requiredFields) {
    if (!config[field] || typeof config[field] !== 'string' || config[field].trim() === '') {
      throw ApiError.badRequest(`Missing required field: ${field}`);
    }
  }

  const accountId = auth.credential.accountId;
  const configKey = `provider_config:${accountId}:${providerId}`;

  const providerConfig = {
    id: configKey,
    accountId,
    providerId,
    apiKey: config.apiKey,
    model: config.model || providerDef.defaultModel,
    baseUrl: config.baseUrl || providerDef.baseUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.providerConfigs?.put(configKey, providerConfig);

  await auditLog('provider_configured', {
    accountId,
    credentialId: auth.credential.id,
    metadata: { providerId, model: providerConfig.model },
  });

  return successResponse({
    provider: {
      id: providerId,
      name: providerDef.name,
      configured: true,
      model: providerConfig.model,
      baseUrl: providerConfig.baseUrl,
    },
  }, 201);
}
