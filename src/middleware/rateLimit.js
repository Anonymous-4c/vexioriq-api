import { ApiError } from '../utils/errors.js';
import { config } from '../config/config.js';

const rateLimitStore = new Map();

function getStoreKey(identifier) {
  return `rl:${identifier}`;
}

function cleanupExpired(windowMs) {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

export function rateLimitMiddleware(identifier, tier = 'anonymous') {
  const limits = config.rateLimit[tier] || config.rateLimit.anonymous;
  const windowMs = limits.windowSeconds * 1000;
  const maxRequests = limits.requests;

  const storeKey = getStoreKey(identifier);
  const now = Date.now();

  let entry = rateLimitStore.get(storeKey);
  if (!entry || now - entry.windowStart > windowMs) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(storeKey, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    throw ApiError.tooManyRequests(`Rate limit exceeded. Retry after ${retryAfter}s`);
  }

  if (rateLimitStore.size > 10000) {
    cleanupExpired(windowMs);
  }

  return {
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(Math.max(0, maxRequests - entry.count)),
    'X-RateLimit-Reset': String(Math.ceil((entry.windowStart + windowMs) / 1000)),
  };
}
