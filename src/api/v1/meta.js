import { successResponse } from '../../utils/response.js';
import { config } from '../../config/config.js';

export function metaHandler() {
  return successResponse({
    service: 'Vexioriq API',
    version: 'v1',
    status: 'operational',
    supportedVersions: config.supportedVersions,
    documentation: config.docsUrl,
    apiReference: config.apiReferenceUrl,
    website: config.websiteUrl,
  });
}
