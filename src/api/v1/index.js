import { healthHandler } from './health.js';
import { metaHandler } from './meta.js';
import { listToolsHandler, getToolHandler, executeToolHandler } from './tools.js';
import {
  initiateLinkHandler,
  completeLinkHandler,
  createCredentialHandler,
  listCredentialsHandler,
  revokeCredentialHandler,
  sessionCreateHandler,
  sessionVerifyHandler,
  generateHandler,
  resourceAccessHandler,
  installationListHandler,
  installationRevokeHandler,
  listProvidersHandler,
  syncProviderConfigHandler,
} from './plugin.js';

export function registerV1Routes(router) {
  router.get('/v1/health', healthHandler);
  router.get('/v1/meta', metaHandler);
  router.get('/v1/tools', listToolsHandler);
  router.get('/v1/tools/:tool', getToolHandler);
  router.post('/v1/tools/:tool', executeToolHandler);

  router.post('/v1/plugin/link/initiate', initiateLinkHandler);
  router.post('/v1/plugin/link/complete', completeLinkHandler);
  router.post('/v1/plugin/credentials', createCredentialHandler);
  router.get('/v1/plugin/credentials', listCredentialsHandler);
  router.post('/v1/plugin/credentials/:credentialId/revoke', revokeCredentialHandler);
  router.post('/v1/plugin/session', sessionCreateHandler);
  router.get('/v1/plugin/session', sessionVerifyHandler);
  router.post('/v1/plugin/generate', generateHandler);
  router.get('/v1/plugin/resource/:resourceToken', resourceAccessHandler);
  router.get('/v1/plugin/installations', installationListHandler);
  router.post('/v1/plugin/installations/:installationId/revoke', installationRevokeHandler);
  router.get('/v1/plugin/providers', listProvidersHandler);
  router.post('/v1/plugin/providers/sync', syncProviderConfigHandler);
}
