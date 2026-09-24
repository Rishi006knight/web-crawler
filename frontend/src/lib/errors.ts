export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed. Please check your internet connection.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timed out after waiting for server response.') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded.', public readonly retryAfterSeconds = 60) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ServerError extends AppError {
  constructor(message: string, public readonly statusCode: number) {
    super(message, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

export class ColdStartError extends AppError {
  constructor(message = 'Crawler backend is waking up from free-tier sleep. Please retry in a few seconds.') {
    super(message, 'COLD_START_ERROR');
    this.name = 'ColdStartError';
  }
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
