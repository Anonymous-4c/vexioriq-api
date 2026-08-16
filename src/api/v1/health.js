import { successResponse } from '../../utils/response.js';

export function healthHandler() {
  return successResponse({
    status: 'ok',
    service: 'vexioriq-api',
    version: 'v1',
  });
}
