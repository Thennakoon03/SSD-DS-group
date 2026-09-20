import express from 'express';
import { getProfile, updateProfile, changePassword, verifyToken } from '../controllers/authController.js';
import { getAllPatients, getAllDoctors, getAllAdmins, verifyDoctor, deleteAdmin } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// register and login are handled by auth-service
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Token verification — used by API Gateway
router.get('/verify', verifyToken);

// User management (admin only)
router.get('/users/patients', protect, getAllPatients);
router.get('/users/doctors',  protect, getAllDoctors);
router.get('/users/admins',   protect, getAllAdmins);
router.delete('/users/admins/:id', protect, deleteAdmin);
router.put('/users/doctors/:id/verify', protect, verifyDoctor);

export default router;
