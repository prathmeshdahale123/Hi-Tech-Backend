import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary configuration
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload file to Cloudinary
 */
export const uploadToCloudinary = async (filePath: string, options: any = {}): Promise<any> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'hitech-institute/notices',
      resource_type: 'auto', // Automatically detect file type
      ...options
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width || null,
      height: result.height || null,
      resourceType: result.resource_type
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

/**
 * Get optimized URL for file
 */
export const getOptimizedUrl = (publicId: string, options: any = {}): string => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  });
};

export default cloudinary;