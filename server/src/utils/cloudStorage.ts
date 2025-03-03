import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to cloud storage
 * @param filePath Local file path
 * @param folder Cloud storage folder
 * @returns Upload result
 */
export const cloudUpload = async (filePath: string, folder: string): Promise<any> => {
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' }, // Optimize quality
        { fetch_format: 'auto' },  // Auto format based on browser
      ],
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    // Delete local file if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    console.error('Error uploading to cloud storage:', error);
    throw new Error('Cloud storage upload failed');
  }
};

/**
 * Delete file from cloud storage
 * @param fileUrl Cloud file URL
 * @returns Deletion result
 */
export const deleteFromCloud = async (fileUrl: string): Promise<any> => {
  try {
    // Extract public ID from URL
    const publicId = getPublicIdFromUrl(fileUrl);
    if (!publicId) {
      throw new Error('Invalid cloud storage URL');
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from cloud storage:', error);
    throw new Error('Cloud storage deletion failed');
  }
};

/**
 * Get public ID from cloud storage URL
 * @param url Cloud storage URL
 * @returns Public ID
 */
const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.ext
    const urlParts = url.split('/');
    const filename = urlParts.pop() || '';
    const folder = urlParts.pop() || '';
    
    // Get filename without extension
    const filenameWithoutExt = path.parse(filename).name;
    
    // Combine folder and filename to get public ID
    return `${folder}/${filenameWithoutExt}`;
  } catch (error) {
    console.error('Error parsing cloud storage URL:', error);
    return null;
  }
};

export default {
  cloudUpload,
  deleteFromCloud,
  getPublicIdFromUrl,
};