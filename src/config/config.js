export const config = {
  service: 'vexioriq-api',
  version: 'v1',
  websiteUrl: 'https://vexioriq.com',
  docsUrl: 'https://vexioriq.com/docs',
  apiReferenceUrl: 'https://vexioriq.com/api-reference',
  productionOrigin: 'https://api.vexioriq.com',

  cors: {
    origins: [
      'https://vexioriq.com',
      'https://api.vexioriq.com',
    ],
    devOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Internal-Secret'],
    maxAge: 86400,
  },

  security: {
    maxBodySize: 1024 * 100,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },

  rateLimit: {
    anonymous: { requests: 60, windowSeconds: 60 },
    free: { requests: 15, windowSeconds: 60 },
    pro: { requests: 300, windowSeconds: 60 },
    business: { requests: 600, windowSeconds: 60 },
    internal: { requests: 1000, windowSeconds: 60 },
  },

  plans: {
    free: { label: 'Free', apiAccess: true, maxApiKeys: 1 },
    pro: { label: 'Pro', apiAccess: true, maxApiKeys: 10 },
    business: { label: 'Business', apiAccess: true, maxApiKeys: -1 },
  },

  apiKey: {
    prefix: 'vxr_',
    keyLength: 48,
    hashAlgorithm: 'SHA-256',
  },

  supportedVersions: ['v1'],
};
