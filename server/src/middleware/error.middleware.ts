// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../utils/errors";
import * as Error from "../utils/errors";

interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
  errors?: any;
  code?: number;
  path?: string;
  value?: string;
}

class ErrorHandler {
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === "development";
  }

  private handleCastError(err: mongoose.Error.CastError): AppError {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new Error.ValidationError(message);
  }

  private handleDuplicateFieldsError(err: any): AppError {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new Error.ValidationError(message);
  }

  private handleValidationError(err: mongoose.Error.ValidationError): AppError {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new Error.ValidationError(message);
  }

  private handleJWTError(): AppError {
    return new Error.AuthenticationError("Invalid token. Please log in again.");
  }

  private handleJWTExpiredError(): AppError {
    return new Error.AuthenticationError("Your token has expired. Please log in again.");
  }

  private formatError(err: AppError): ErrorResponse {
    const response: ErrorResponse = {
      status: err.status || "error",
      message: err.message,
    };

    // Add stack trace in development
    if (this.isDev) {
      response.stack = err.stack;
    }

    return response;
  }

  public handleError = (
    err: Error,
    req: Request,
    res: Response,
    _: NextFunction
  ): void => {
    let error = err instanceof AppError ? err : new AppError(err.message, 500);

    // Set default status code if not set
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";

    // Handle specific error types
    if (err instanceof mongoose.Error.CastError) {
      error = this.handleCastError(err);
    }
    if ((err as any).code === 11000) {
      error = this.handleDuplicateFieldsError(err);
    }
    if (err instanceof mongoose.Error.ValidationError) {
      error = this.handleValidationError(err);
    }
    if (err instanceof JsonWebTokenError) {
      error = this.handleJWTError();
    }
    if (err instanceof TokenExpiredError) {
      error = this.handleJWTExpiredError();
    }

    // Handle Multer errors
    if (err.name === "MulterError") {
      error = new AppError(err.message, 400);
    }

    // Send response
    const formattedError = this.formatError(error);

    res.status(error.statusCode).json({
      ...formattedError,
      ...(this.isDev && {
        path: req.path,
        timestamp: new Date().toISOString(),
      }),
    });
  };
}

// Create error handler instance
const errorHandler = new ErrorHandler();

// Export the handleError method
export { errorHandler };
