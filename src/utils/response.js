export function successResponse(data, status = 200) {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function errorResponse(error, status = 500) {
  const body = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    },
  };

  if (error.details) {
    body.error.details = error.details;
  }

  return new Response(
    JSON.stringify(body),
    {
      status: error.statusCode || status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}
