export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @class ValidationError
 * for 400 status code
 **/
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// 400 Bad Request - Use for validation errors or malformed requests
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

/**
 * @class AuthenticationError
 * for 401 status code
 */
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

/**
 * @class ForbiddenError
 * for 403 status code
 */
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

/**
 * @class NotFoundError
 * for 404 status code
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

/**
 * @class ConflictError
 * for 409 status code
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * @class TooManyRequestsError
 * for 429 status code
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(message, 429);
  }
}