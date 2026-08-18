import { getProvider, validateProviderConfig, getProviderConfig } from './providers.js';
import { hasCapability } from './capabilities.js';
import { createResourceAuth } from './resourceAuth.js';
import { auditLog } from './audit.js';

export async function generateContent(session, request, env) {
  const { capability, prompt, context, providerConfig } = request;

  if (!hasCapability(session.capabilities, capability)) {
    return { success: false, error: { code: 'CAPABILITY_NOT_ALLOWED', message: 'This capability is not authorized' } };
  }

  if (!providerConfig || !providerConfig.provider) {
    return { success: false, error: { code: 'INVALID_PROVIDER_CONFIG', message: 'Provider configuration required' } };
  }

  const validation = validateProviderConfig(providerConfig.provider, providerConfig);
  if (!validation.valid) {
    return { success: false, error: { code: 'INVALID_PROVIDER_CONFIG', message: validation.error } };
  }

  const config = getProviderConfig(providerConfig.provider, providerConfig);

  const resourceAuth = await createResourceAuth(session.id, 'generation', capability);

  await auditLog('resource_accessed', {
    accountId: session.accountId,
    credentialId: session.credentialId,
    installationId: session.installationId,
    sessionId: session.id,
    metadata: { capability, provider: config.provider, model: config.model },
  });

  return {
    success: true,
    data: {
      resourceToken: resourceAuth.token,
      provider: config.provider,
      model: config.model,
      orchestration: {
        type: 'byok',
        endpoint: config.baseUrl,
        instructions: `Use the user's ${config.provider} credentials to generate content. Apply Vexioriq orchestration rules.`,
        capabilities: session.capabilities.filter(c => c.startsWith('ai.generate.')),
      },
      prompt,
      context: context || null,
    },
  };
}

export async function getResource(resourceToken, session, resourceType) {
  const { verifyResourceAuth } = await import('./resourceAuth.js');
  const auth = await verifyResourceAuth(resourceToken, session.id);
  if (!auth) {
    return { success: false, error: { code: 'RESOURCE_NOT_AUTHORIZED', message: 'Invalid or expired resource authorization' } };
  }

  if (auth.resourceType !== resourceType) {
    return { success: false, error: { code: 'RESOURCE_NOT_AUTHORIZED', message: 'Resource type mismatch' } };
  }

  return { success: true, data: { authorized: true, scope: auth.resourceScope } };
}
