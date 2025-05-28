import multer from 'multer';
import { Request } from 'express';
import { config } from '../config/environment';
import { AppError } from './errorHandler';

/**
 * Configure multer for temporary storage before uploading to Cloudinary
 * Files will be stored in memory temporarily
 */
const storage = multer.memoryStorage();

/**
 * File filter function to validate file types
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file type is allowed
  if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new AppError(
      `File type ${file.mimetype} is not allowed. Allowed types: ${config.ALLOWED_FILE_TYPES.join(', ')}`,
      400
    );
    cb(error as any, false);
  }
};

/**
 * Configure multer with options for Cloudinary upload
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // Max file size in bytes
    files: 1 // Maximum number of files
  }
});

/**
 * Middleware for single file upload with field name 'attachment'
 */
export const uploadSingle = upload.single('attachment');

/**
 * Handle multer errors for Cloudinary uploads
 */
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large',
          errors: [`File size must be less than ${(config.MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)}MB`]
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files',
          errors: ['Only one file is allowed']
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field',
          errors: ['File must be uploaded with field name "attachment"']
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          errors: [error.message]
        });
    }
  }
  
  next(error);
};

/**
 * Optional file upload middleware for Cloudinary - allows requests without files
 */
export const optionalCloudinaryUpload = (req: Request, res: any, next: any) => {
  uploadSingle(req, res, (error) => {
    if (error) {
      return handleMulterError(error, req, res, next);
    }
    next();
  });
};

/**
 * Required file upload middleware for Cloudinary - requires a file to be uploaded
 */
export const requiredCloudinaryUpload = (req: Request, res: any, next: any) => {
  uploadSingle(req, res, (error) => {
    if (error) {
      return handleMulterError(error, req, res, next);
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File required',
        errors: ['Please upload a file']
      });
    }
    
    next();
  });
};