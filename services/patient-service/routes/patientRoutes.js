import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deactivateAccount,
  deleteAccount,
  getAllPatients,
  getPatientById,
} from '../controlles/patientController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { serviceProtect } from '../middlewares/serviceMiddleware.js';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

// register and login are handled by auth-service
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/image', protect, upload.single('profileImage'), uploadProfileImage);
router.put('/change-password', protect, changePassword);
router.put('/deactivate', protect, deactivateAccount);
router.delete('/delete', protect, deleteAccount);

// Internal service-to-service routes
router.get('/admin/all', serviceProtect, getAllPatients);
router.get('/:id', serviceProtect, getPatientById);

export default router;
