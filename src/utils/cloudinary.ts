import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// Fungsi lama (buat jaga-jaga)
export async function uploadBase64ToCloudinary(base64String: string) {
  const result = await cloudinary.uploader.upload(base64String, { folder: 'catatankuy' });
  return result.secure_url;
}

// FUNGSI BARU: Upload dari file fisik
export async function uploadFileToCloudinary(filePath: string) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'catatankuy',
    });
    return result.secure_url;
  } catch (error: any) {
    throw new Error(`Gagal upload file ke Cloudinary: ${error.message}`);
  }
}

export default cloudinary;