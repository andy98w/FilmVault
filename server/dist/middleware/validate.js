"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const error_1 = require("./error");
// Middleware to validate requests
const validate = (validations) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // Execute all validations
        yield Promise.all(validations.map(validation => validation.run(req)));
        // Get validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        // Format validation errors
        const formattedErrors = errors.array().map((error) => ({
            field: error.param,
            message: error.msg
        }));
        // Throw API error with validation details
        const errorMessage = 'Validation failed';
        const apiError = new error_1.ApiError(400, errorMessage);
        // Add validation errors to the response
        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: errorMessage,
            errors: formattedErrors
        });
    });
};
exports.validate = validate;
