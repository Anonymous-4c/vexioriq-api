import { config } from '../config/config.js';

export function securityHeaders() {
  return { ...config.security.headers };
}

export function validateBodySize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > config.security.maxBodySize) {
    return false;
  }
  return true;
}
