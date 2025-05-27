import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify fs functions
const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);

/**
 * File helper utilities
 */

/**
 * Delete a file from the filesystem
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    // Check if file exists
    const fileExists = await existsAsync(filePath);
    
    if (!fileExists) {
      console.warn(`File does not exist: ${filePath}`);
      return true; // Consider it successful if file doesn't exist
    }

    // Delete the file
    await unlinkAsync(filePath);
    console.log(`✅ File deleted successfully: ${filePath}`);
    return true;

  } catch (error) {
    console.error(`❌ Error deleting file ${filePath}:`, error);
    return false;
  }
};

/**
 * Check if a file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    return await existsAsync(filePath);
  } catch (error) {
    console.error(`Error checking file existence ${filePath}:`, error);
    return false;
  }
};

/**
 * Get file size in bytes
 */
export const getFileSize = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats.size);
      }
    });
  });
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

/**
 * Get file name without extension
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  return path.basename(filename, path.extname(filename));
};

/**
 * Sanitize filename by removing special characters
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove or replace special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

/**
 * Generate unique filename with timestamp
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);
  const sanitizedName = sanitizeFilename(nameWithoutExt);
  
  return `${sanitizedName}-${timestamp}-${randomString}${extension}`;
};

/**
 * Validate file type against allowed MIME types
 */
export const isAllowedFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size against maximum allowed size
 */
export const isAllowedFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

/**
 * Get human readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get MIME type category
 */
export const getMimeTypeCategory = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('text/')) return 'text';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
};

/**
 * Create directory if it doesn't exist
 */
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
};

/**
 * Clean up old files in a directory (older than specified days)
 */
export const cleanupOldFiles = async (directoryPath: string, daysOld: number): Promise<number> => {
  try {
    const files = fs.readdirSync(directoryPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        const deleted = await deleteFile(filePath);
        if (deleted) deletedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${deletedCount} old files from ${directoryPath}`);
    return deletedCount;
    
  } catch (error) {
    console.error(`Error cleaning up old files in ${directoryPath}:`, error);
    return 0;
  }
};
