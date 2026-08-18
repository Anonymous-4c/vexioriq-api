import { PRODUCTS, productHasCapability } from './products.js';

export const ALL_CAPABILITIES = Object.values(PRODUCTS).flatMap(p => p.capabilities);

export function resolveCapabilities(accountId, productId, entitlements) {
  const product = PRODUCTS[productId];
  if (!product) return [];

  const ent = entitlements.find(e =>
    e.productId === productId &&
    e.accountId === accountId &&
    e.status === 'active'
  );

  if (!ent) return [];
  return [...product.capabilities];
}

export function hasCapability(capabilities, required) {
  return capabilities.includes(required);
}

export function hasAnyCapability(capabilities, ...required) {
  return required.some(c => capabilities.includes(c));
}
