export const PRODUCTS = {
  'wp-ai-studio': {
    id: 'wp-ai-studio',
    name: 'Vexioriq AI Studio for WordPress',
    capabilities: [
      'ai.generate.post',
      'ai.generate.page',
      'ai.generate.pattern',
      'ai.generate.widget',
      'ai.generate.template',
      'architecture.analyze',
      'architecture.generate',
      'resource.patterns',
      'resource.templates',
    ],
  },
};

export function getProduct(productId) {
  return PRODUCTS[productId] || null;
}

export function productHasCapability(productId, capability) {
  const product = PRODUCTS[productId];
  if (!product) return false;
  return product.capabilities.includes(capability);
}
