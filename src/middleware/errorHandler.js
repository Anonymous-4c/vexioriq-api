import { errorResponse } from '../utils/response.js';
import { ApiError } from '../utils/errors.js';
import { securityHeaders } from './security.js';

export function errorHandler(error, requestId) {
  if (error instanceof ApiError) {
    const resp = errorResponse(error);
    const headers = securityHeaders();
    headers['X-Request-ID'] = requestId;
    for (const [k, v] of Object.entries(headers)) {
      resp.headers.set(k, v);
    }
    return resp;
  }

  console.error(`[${requestId}] Unhandled error:`, error.message || error);

  const apiError = ApiError.internal();
  const resp = errorResponse(apiError);
  const headers = securityHeaders();
  headers['X-Request-ID'] = requestId;
  for (const [k, v] of Object.entries(headers)) {
    resp.headers.set(k, v);
  }
  return resp;
}
