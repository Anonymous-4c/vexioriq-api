export const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    requiredFields: ['apiKey'],
    optionalFields: ['model', 'baseUrl'],
    defaultModel: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    requiredFields: ['apiKey'],
    optionalFields: ['model'],
    defaultModel: 'claude-sonnet-4-20250514',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    requiredFields: ['apiKey'],
    optionalFields: ['model'],
    defaultModel: 'gemini-1.5-pro',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  xai: {
    id: 'xai',
    name: 'xAI Grok',
    requiredFields: ['apiKey'],
    optionalFields: ['model'],
    defaultModel: 'grok-2',
    baseUrl: 'https://api.x.ai/v1',
    models: ['grok-2', 'grok-2-mini'],
  },
};

export function getProvider(providerId) {
  return AI_PROVIDERS[providerId] || null;
}

export function validateProviderConfig(providerId, config) {
  const provider = AI_PROVIDERS[providerId];
  if (!provider) return { valid: false, error: `Unknown provider: ${providerId}` };

  for (const field of provider.requiredFields) {
    if (!config[field] || typeof config[field] !== 'string' || config[field].trim() === '') {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  if (config.model && !provider.models.includes(config.model)) {
    return { valid: false, error: `Invalid model for ${provider.name}: ${config.model}` };
  }

  return { valid: true };
}

export function getProviderConfig(providerId, config) {
  const provider = AI_PROVIDERS[providerId];
  if (!provider) return null;

  return {
    provider: providerId,
    apiKey: config.apiKey,
    model: config.model || provider.defaultModel,
    baseUrl: config.baseUrl || provider.baseUrl,
  };
}
