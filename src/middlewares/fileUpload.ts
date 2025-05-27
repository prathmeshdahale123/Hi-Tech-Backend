import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { config } from '../config/environment';
import { AppError } from './errorHandler';

/**
 * Ensure uploads directory exists
 */
const ensureUploadsDir = (): void => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
};

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    ensureUploadsDir();
    cb(null, 'uploads/');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    const filename = `${sanitizedName}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

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
 * Configure multer with options
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
 * Handle multer errors
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
 * Optional file upload middleware - allows requests without files
 */
export const optionalFileUpload = (req: Request, res: any, next: any) => {
  uploadSingle(req, res, (error) => {
    if (error) {
      return handleMulterError(error, req, res, next);
    }
    next();
  });
};

/**
 * Required file upload middleware - requires a file to be uploaded
 */
export const requiredFileUpload = (req: Request, res: any, next: any) => {
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
