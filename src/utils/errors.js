export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request') {
    return new ApiError(400, 'BAD_REQUEST', message);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static methodNotAllowed(message = 'Method not allowed') {
    return new ApiError(405, 'METHOD_NOT_ALLOWED', message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Rate limit exceeded') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  static unavailable(message = 'Service temporarily unavailable') {
    return new ApiError(503, 'UNAVAILABLE', message);
  }
}
