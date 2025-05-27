import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle different types of errors and send appropriate responses
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let errors: string[] = [];

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(error.errors).map((err: any) => err.message);
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
    const field = Object.keys(error.keyValue)[0];
    errors = [`${field} already exists`];
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errors = ['The provided ID is not valid'];
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errors = ['Please provide a valid authentication token'];
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errors = ['Authentication token has expired'];
  }

  // Handle Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
    errors = ['File size exceeds the maximum allowed limit'];
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    errors = ['Unexpected file field in the request'];
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  } else {
    // Log only essential information in production
    console.error('Production Error:', {
      message,
      statusCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  });
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404
  );
  next(error);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
