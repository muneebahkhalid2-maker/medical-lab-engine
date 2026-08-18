import fs from 'fs';
import path from 'path';

let cloudinary: any = null;
try {
  cloudinary = require('cloudinary').v2;
  if (cloudinary) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET || ''
    });
  }
} catch (e) {
  // Cloudinary module optional
}

export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

export const uploadToCloudinary = async (filePath: string, folder = 'medical_documents') => {
  if (!isCloudinaryConfigured()) {
    console.log('[Cloudinary] API keys not configured. Falling back to local file path:', filePath);
    const fileName = path.basename(filePath);
    return {
      secure_url: `/uploads/${fileName}`,
      public_id: `local_${fileName}`
    };
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto'
    });
    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('[Cloudinary Upload Error]:', error);
    const fileName = path.basename(filePath);
    return {
      secure_url: `/uploads/${fileName}`,
      public_id: `local_${fileName}`
    };
  }
};

export default cloudinary;
