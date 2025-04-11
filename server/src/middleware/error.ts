import { Request, Response, NextFunction } from 'express';

// Custom API error class
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error code constants
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

// Error handling middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for server-side debugging
  console.error('Error:', err);
  
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Server error';
  let errorCode = ERROR_CODES.SERVER_ERROR;
  
  // Handle known error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    
    // Map status codes to error codes
    switch (statusCode) {
      case 400:
        errorCode = ERROR_CODES.VALIDATION_ERROR;
        break;
      case 401:
        errorCode = ERROR_CODES.AUTHENTICATION_ERROR;
        break;
      case 403:
        errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        break;
      case 404:
        errorCode = ERROR_CODES.RESOURCE_NOT_FOUND;
        break;
      default:
        errorCode = ERROR_CODES.SERVER_ERROR;
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = ERROR_CODES.AUTHENTICATION_ERROR;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = ERROR_CODES.AUTHENTICATION_ERROR;
  } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
    statusCode = 400;
    message = 'Validation error';
    errorCode = ERROR_CODES.VALIDATION_ERROR;
  }
  
  // Don't expose error details in production
  if (process.env.NODE_ENV === 'production' && !(err instanceof ApiError)) {
    message = 'Something went wrong';
  }
  
  // Send standardized error response
  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};