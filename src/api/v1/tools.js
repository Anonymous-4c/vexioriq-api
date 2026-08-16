import { successResponse } from '../../utils/response.js';
import { listTools, getToolBySlug, getToolMetadata } from '../../tools/registry.js';
import { ApiError } from '../../utils/errors.js';
import { validateJsonBody } from '../../middleware/validation.js';

export function listToolsHandler(request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const access = url.searchParams.get('access');

  const tools = listTools({ category, access });
  return successResponse({
    tools,
    count: tools.length,
  });
}

export function getToolHandler(request, env, params) {
  const slug = params.tool;
  const tool = getToolBySlug(slug);
  if (!tool) {
    throw ApiError.notFound(`Tool '${slug}' not found`);
  }
  const { execute, ...meta } = tool;
  return successResponse(meta);
}

export async function executeToolHandler(request, env, params) {
  const slug = params.tool;
  const tool = getToolBySlug(slug);
  if (!tool) {
    throw ApiError.notFound(`Tool '${slug}' not found`);
  }

  if (tool.access === 'premium' && (!env.ALLOWED_PLANS || !env.ALLOWED_PLANS.includes('premium'))) {
    throw ApiError.forbidden('This tool requires a premium subscription');
  }

  const body = await validateJsonBody(request, tool.inputSchema);

  try {
    const result = await tool.execute(body, env);
    return successResponse(result);
  } catch (e) {
    throw ApiError.badRequest(`Tool execution failed: ${e.message}`);
  }
}
