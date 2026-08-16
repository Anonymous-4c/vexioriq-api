const registry = new Map();

export function registerTool(tool) {
  if (!tool.id || !tool.name || !tool.execute) {
    throw new Error(`Tool missing required fields: id, name, execute`);
  }
  registry.set(tool.id, {
    id: tool.id,
    name: tool.name,
    slug: tool.slug || tool.id,
    description: tool.description || '',
    version: tool.version || '1.0.0',
    category: tool.category || 'general',
    method: tool.method || 'POST',
    path: tool.path || `/v1/tools/${tool.slug || tool.id}`,
    access: tool.access || 'free',
    requiredScopes: tool.requiredScopes || ['tools:execute'],
    rateLimitTier: tool.rateLimitTier || 'authenticated',
    inputSchema: tool.inputSchema || null,
    outputSchema: tool.outputSchema || null,
    examples: tool.examples || [],
    tags: tool.tags || [],
    execute: tool.execute,
  });
}

export function getTool(id) {
  return registry.get(id) || null;
}

export function getToolBySlug(slug) {
  for (const tool of registry.values()) {
    if (tool.slug === slug || tool.id === slug) return tool;
  }
  return null;
}

export function listTools(filter = {}) {
  const tools = Array.from(registry.values()).map((t) => {
    const { execute, ...meta } = t;
    return meta;
  });

  return tools.filter((t) => {
    if (filter.category && t.category !== filter.category) return false;
    if (filter.access && t.access !== filter.access) return false;
    return true;
  });
}

export function getToolMetadata(id) {
  const tool = registry.get(id);
  if (!tool) return null;
  const { execute, ...meta } = tool;
  return meta;
}
