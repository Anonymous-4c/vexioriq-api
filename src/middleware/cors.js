import { config } from '../config/config.js';

export function corsMiddleware(request, env) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    ...config.cors.origins,
    ...config.cors.devOrigins,
  ];

  if (env.CORS_ORIGINS) {
    allowedOrigins.push(...env.CORS_ORIGINS.split(',').map((o) => o.trim()));
  }

  const isAllowed = allowedOrigins.includes(origin);

  const headers = {};
  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (!origin && request.method !== 'OPTIONS') {
    headers['Access-Control-Allow-Origin'] = config.cors.origins[0];
  }

  headers['Access-Control-Allow-Methods'] = config.cors.methods.join(', ');
  headers['Access-Control-Allow-Headers'] = config.cors.allowedHeaders.join(', ');
  headers['Access-Control-Max-Age'] = String(config.cors.maxAge);
  headers['Access-Control-Expose-Headers'] = 'X-Request-ID';

  return headers;
}

export function handleCorsOptions(request, env) {
  const corsHeaders = corsMiddleware(request, env);
  return new Response(null, { status: 204, headers: corsHeaders });
}
