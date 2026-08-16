import { healthHandler } from './health.js';
import { metaHandler } from './meta.js';
import { listToolsHandler, getToolHandler, executeToolHandler } from './tools.js';

export function registerV1Routes(router) {
  router.get('/v1/health', healthHandler);
  router.get('/v1/meta', metaHandler);
  router.get('/v1/tools', listToolsHandler);
  router.get('/v1/tools/:tool', getToolHandler);
  router.post('/v1/tools/:tool', executeToolHandler);
}
