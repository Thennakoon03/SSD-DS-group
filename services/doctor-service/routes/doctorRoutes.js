import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deactivateAccount,
  activateAccount,
  deleteAccount,
  getDoctors,
  getDoctorById,
  getAllDoctors,
  toggleAvailability,
  verifyDoctor,
} from '../controllers/doctorController.js';
import { getPatientDetails, getPatientReports, getPatientReportById } from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { serviceProtect } from '../middlewares/serviceMiddleware.js';
import { authorizePatientAccess } from '../middlewares/patientAccessMiddleware.js';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

// register and login are handled by auth-service
// Public
router.get('/', getDoctors);              
router.put('/activate', activateAccount);  

// Internal service-to-service routes
router.get('/admin/all', serviceProtect, getAllDoctors);
router.put('/admin/:id/verify', serviceProtect, verifyDoctor);

// Protected 
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/image', protect, upload.single('profileImage'), uploadProfileImage);
router.put('/change-password', protect, changePassword);
router.put('/availability', protect, toggleAvailability);
router.put('/deactivate', protect, deactivateAccount);
router.delete('/delete', protect, deleteAccount);

// Patient data — doctor can view only patients they have a treatment relationship with
router.get('/patients/:patientId', protect, authorizePatientAccess, getPatientDetails);
router.get('/patients/:patientId/reports', protect, authorizePatientAccess, getPatientReports);
router.get('/patients/:patientId/reports/:reportId', protect, authorizePatientAccess, getPatientReportById);

router.get('/:id', getDoctorById);

export default router;
