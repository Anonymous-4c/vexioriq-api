import { createRouter } from './router/router.js';
import { registerV1Routes } from './api/v1/index.js';
import { corsMiddleware, handleCorsOptions } from './middleware/cors.js';
import { securityHeaders } from './middleware/security.js';
import { authenticationMiddleware } from './middleware/authentication.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generateRequestId } from './utils/ids.js';
import { ApiError } from './utils/errors.js';
import { errorResponse, jsonResponse } from './utils/response.js';

import './tools/index.js';

const router = createRouter();
registerV1Routes(router);

export default {
  async fetch(request, env, ctx) {
    const requestId = generateRequestId();
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    try {
      if (method === 'OPTIONS') {
        return handleCorsOptions(request, env);
      }

      const matched = router.match(method, pathname);
      if (!matched) {
        if (router.matchPath(pathname)) {
          throw ApiError.methodNotAllowed(`Method ${method} not allowed for ${pathname}`);
        }
        throw ApiError.notFound('Endpoint not found');
      }

      const corsHeaders = corsMiddleware(request, env);
      const secHeaders = securityHeaders();

      let authContext = { authenticated: false, tier: 'anonymous', keyContext: null };
      const needsAuth = matched.handler._requiresAuth;
      if (needsAuth) {
        authContext = await authenticationMiddleware(request, env);
      }

      const rateLimitId = authContext.authenticated
        ? authContext.keyContext.id
        : (request.headers.get('x-forwarded-for') || 'anonymous');
      const rlHeaders = rateLimitMiddleware(rateLimitId, authContext.tier);

      const result = await matched.handler(request, env, matched.params, authContext);

      if (result instanceof Response) {
        for (const [k, v] of Object.entries({ ...corsHeaders, ...secHeaders, ...rlHeaders, 'X-Request-ID': requestId })) {
          result.headers.set(k, v);
        }
        return result;
      }

      return jsonResponse(result, 200, { ...corsHeaders, ...secHeaders, ...rlHeaders, 'X-Request-ID': requestId });
    } catch (error) {
      const resp = errorHandler(error, requestId);
      const corsHeaders = corsMiddleware(request, env);
      const secHeaders = securityHeaders();
      for (const [k, v] of Object.entries({ ...corsHeaders, ...secHeaders })) {
        resp.headers.set(k, v);
      }
      return resp;
    }
  },
};
