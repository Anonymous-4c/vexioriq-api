export const SCOPES = {
  TOOLS_READ: 'tools:read',
  TOOLS_EXECUTE: 'tools:execute',
  KEYS_MANAGE: 'keys:manage',
  USAGE_READ: 'usage:read',
};

export function hasScope(userScopes, requiredScope) {
  return userScopes.includes(requiredScope);
}

export function hasAnyScope(userScopes, ...requiredScopes) {
  return requiredScopes.some((s) => userScopes.includes(s));
}
