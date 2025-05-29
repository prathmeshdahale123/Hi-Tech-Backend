import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Utility methods for Cloudinary image operations: upload & delete
 */
export const cloudinaryUtils = {
  /**
   * Uploads a file buffer to Cloudinary using a stream
   * @param buffer - The file buffer (from multer.memoryStorage())
   * @param folder - Folder name on Cloudinary
   * @returns Promise with Cloudinary upload result
   */
  upload: (buffer: Buffer, folder: string): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed.'));
          resolve(result);
        }
      );

      // Convert buffer to readable stream and pipe to Cloudinary
      const readable = new Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  },

  /**
   * Deletes an image from Cloudinary by publicId
   * @param publicId - The public ID of the image to delete
   * @returns Promise resolving to Cloudinary's deletion response
   */
  delete: (publicId: string): Promise<any> => {
    return cloudinary.uploader.destroy(publicId);
  }
};
