export function parseBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  return null;
}

export function getQueryParam(url, name) {
  const u = new URL(url);
  return u.searchParams.get(name);
}

export function getPathParam(pathname, pattern) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i] || '');
    }
  }
  return params;
}

export function extractBearerToken(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}
