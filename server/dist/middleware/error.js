"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.ERROR_CODES = exports.ApiError = void 0;
// Custom API error class
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// Error code constants
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SERVER_ERROR: 'SERVER_ERROR'
};
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    // Log error for server-side debugging
    console.error('Error:', err);
    // Default to 500 server error
    let statusCode = 500;
    let message = 'Server error';
    let errorCode = exports.ERROR_CODES.SERVER_ERROR;
    // Handle known error types
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        // Map status codes to error codes
        switch (statusCode) {
            case 400:
                errorCode = exports.ERROR_CODES.VALIDATION_ERROR;
                break;
            case 401:
                errorCode = exports.ERROR_CODES.AUTHENTICATION_ERROR;
                break;
            case 403:
                errorCode = exports.ERROR_CODES.AUTHORIZATION_ERROR;
                break;
            case 404:
                errorCode = exports.ERROR_CODES.RESOURCE_NOT_FOUND;
                break;
            default:
                errorCode = exports.ERROR_CODES.SERVER_ERROR;
        }
    }
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorCode = exports.ERROR_CODES.AUTHENTICATION_ERROR;
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorCode = exports.ERROR_CODES.AUTHENTICATION_ERROR;
    }
    else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
        statusCode = 400;
        message = 'Validation error';
        errorCode = exports.ERROR_CODES.VALIDATION_ERROR;
    }
    // Don't expose error details in production
    if (process.env.NODE_ENV === 'production' && !err instanceof ApiError) {
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
exports.errorHandler = errorHandler;
// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
