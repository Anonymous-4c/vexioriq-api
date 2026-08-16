import { ApiError } from '../utils/errors.js';

export function validateJsonBody(request, schema) {
  if (!schema) return {};

  const contentType = request.headers.get('content-type') || '';
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    if (!contentType.includes('application/json')) {
      throw ApiError.badRequest('Content-Type must be application/json');
    }
  }

  return request.json().then((body) => {
    const errors = [];
    if (schema.required) {
      for (const field of schema.required) {
        if (body[field] === undefined || body[field] === null) {
          errors.push({ field, message: `${field} is required` });
        }
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const value = body[key];
        if (value !== undefined && propSchema.type) {
          if (propSchema.type === 'string' && typeof value !== 'string') {
            errors.push({ field: key, message: `${key} must be a string` });
          }
          if (propSchema.type === 'number' && typeof value !== 'number') {
            errors.push({ field: key, message: `${key} must be a number` });
          }
          if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
            errors.push({ field: key, message: `${key} must be a boolean` });
          }
          if (propSchema.type === 'array' && !Array.isArray(value)) {
            errors.push({ field: key, message: `${key} must be an array` });
          }
        }
        if (propSchema.maxLength && typeof value === 'string' && value.length > propSchema.maxLength) {
          errors.push({ field: key, message: `${key} exceeds max length of ${propSchema.maxLength}` });
        }
      }
    }
    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed');
    }
    return body;
  });
}
