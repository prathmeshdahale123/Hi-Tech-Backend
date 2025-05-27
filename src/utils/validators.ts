import Joi from 'joi';

/**
 * Validation schema for admin sign in
 */
export const signInSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    })
});

/**
 * Validation schema for notice creation/update
 */
export const noticeSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required'
    }),
  date: Joi.date()
    .optional()
    .messages({
      'date.base': 'Please provide a valid date'
    })
});

/**
 * Validation schema for admin registration (for seeding or admin creation)
 */
export const adminRegistrationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('admin', 'super_admin')
    .default('admin')
    .messages({
      'any.only': 'Role must be either admin or super_admin'
    })
});

/**
 * Validation schema for query parameters
 */
export const queryParamsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    })
});

/**
 * Validation schema for MongoDB ObjectId
 */
export const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid ID format',
    'any.required': 'ID is required'
  });

/**
 * Helper functions for validation
 */

/**
 * Validate admin sign in data
 */
export const validateSignIn = (data: any) => {
  return signInSchema.validate(data, { abortEarly: false });
};

/**
 * Validate notice data
 */
export const validateNotice = (data: any) => {
  return noticeSchema.validate(data, { abortEarly: false });
};

/**
 * Validate admin registration data
 */
export const validateAdminRegistration = (data: any) => {
  return adminRegistrationSchema.validate(data, { abortEarly: false });
};

/**
 * Validate query parameters
 */
export const validateQueryParams = (data: any) => {
  return queryParamsSchema.validate(data, { abortEarly: false });
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (id: string) => {
  return objectIdSchema.validate(id);
};

/**
 * Custom validation for file types
 */
export const validateFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Custom validation for file size
 */
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};
