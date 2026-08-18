import { ApiError } from '../utils/errors.js';

const rateLimitStore = new Map();

const PLUGIN_LIMITS = {
  'session.create': { requests: 10, windowMs: 60000 },
  'session.verify': { requests: 100, windowMs: 60000 },
  'credential.verify': { requests: 100, windowMs: 60000 },
  'resource.access': { requests: 50, windowMs: 60000 },
  'link.create': { requests: 5, windowMs: 60000 },
  'link.complete': { requests: 10, windowMs: 60000 },
  'default': { requests: 60, windowMs: 60000 },
};

export function pluginRateLimit(identifier, operation) {
  const limits = PLUGIN_LIMITS[operation] || PLUGIN_LIMITS.default;
  const windowMs = limits.windowMs;
  const maxRequests = limits.requests;

  const key = `${identifier}:${operation}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    throw ApiError.tooManyRequests(`Rate limit exceeded for ${operation}. Retry after ${retryAfter}s`);
  }

  if (rateLimitStore.size > 50000) {
    cleanupExpired();
  }

  return {
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(Math.max(0, maxRequests - entry.count)),
    'X-RateLimit-Reset': String(Math.ceil((entry.windowStart + windowMs) / 1000)),
  };
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > 300000) {
      rateLimitStore.delete(key);
    }
  }
}

export function resetPluginRateLimit() {
  rateLimitStore.clear();
}
