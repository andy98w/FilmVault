import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from './error';

// Middleware to validate requests
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Get validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.param,
      message: error.msg
    }));

    // Throw API error with validation details
    const errorMessage = 'Validation failed';
    const apiError = new ApiError(400, errorMessage);
    
    // Add validation errors to the response
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: errorMessage,
      errors: formattedErrors
    });
  };
};