import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import path from 'path';

// Storage for patient profile avatars
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'healthcare/patient-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

// Storage for medical reports (PDFs, images, scans)
const reportStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'healthcare/patient-reports',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'auto',
  },
});

// Whitelist configuration for security validation
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTS  = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const ALLOWED_REPORT_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const ALLOWED_REPORT_EXTS  = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

// File filter to prevent arbitrary file upload & executable/script files (SVG, HTML, EXE, etc.)
const imageFileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(file.mimetype) || !ALLOWED_IMAGE_EXTS.has(ext)) {
    return cb(new Error('INVALID_FILE_TYPE: Only JPEG, PNG, and WebP images up to 2MB are permitted'));
  }
  cb(null, true);
};

const reportFileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_REPORT_MIMES.has(file.mimetype) || !ALLOWED_REPORT_EXTS.has(ext)) {
    return cb(new Error('INVALID_FILE_TYPE: Only PDF, JPEG, PNG, and WebP files up to 5MB are permitted'));
  }
  cb(null, true);
};

// Multer upload instances with strict limits and type filtering
export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit for profile images
    files: 1,
  },
  fileFilter: imageFileFilter,
});

export const reportUpload = multer({
  storage: reportStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit for medical reports
    files: 1,
  },
  fileFilter: reportFileFilter,
});

export default cloudinary;

