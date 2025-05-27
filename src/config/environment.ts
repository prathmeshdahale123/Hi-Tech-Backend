import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  BCRYPT_SALT_ROUNDS: number;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  CORS_ORIGIN: string | string[];
}

/**
 * Application configuration from environment variables
 */
export const config: Config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hitech-institute',
  JWT_SECRET: process.env.JWT_SECRET || 'hitech-jwt-secret-key-2024',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5000']
};

/**
 * Validate required environment variables
 */
export const validateEnvironment = (): void => {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  
  for (const envVar of requiredVars) {
    if (!process.env[envVar] && !config[envVar as keyof Config]) {
      throw new Error(`❌ Missing required environment variable: ${envVar}`);
    }
  }

  if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'hitech-jwt-secret-key-2024') {
    console.warn('⚠️ WARNING: Using default JWT secret in production. Please set JWT_SECRET environment variable.');
  }

  console.log('✅ Environment variables validated successfully');
};
