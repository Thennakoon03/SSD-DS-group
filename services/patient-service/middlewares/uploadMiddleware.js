import multer from 'multer';
import { reportUpload, upload } from '../config/cloudinaryConfig.js';

/**
 * Middleware wrapper for medical report uploads.
 * Handles Multer errors such as LIMIT_FILE_SIZE and INVALID_FILE_TYPE cleanly.
 */
export const handleReportUpload = (req, res, next) => {
  reportUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds the 5MB limit. Please upload a smaller file.',
          });
        }
        return res.status(400).json({
          success: false,
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      }
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE_TYPE',
        message: err.message || 'File upload failed security validation.',
      });
    }
    next();
  });
};

/**
 * Middleware wrapper for patient profile image uploads.
 * Handles Multer errors such as LIMIT_FILE_SIZE (2MB) and INVALID_FILE_TYPE cleanly.
 */
export const handleProfileImageUpload = (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            code: 'FILE_TOO_LARGE',
            message: 'Profile image exceeds the 2MB limit. Please upload a smaller image.',
          });
        }
        return res.status(400).json({
          success: false,
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      }
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE_TYPE',
        message: err.message || 'Profile image upload failed security validation.',
      });
    }
    next();
  });
};
