import express from 'express';
import {
  registerPatient, registerDoctor, registerAdmin,
  loginPatient,    loginDoctor,    loginAdmin,
  googleAuthPatient, googleAuthDoctor,
  logout, verifyToken,
} from '../controllers/authController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ── Patient ───────────────────────────────────────────────────────────────────
router.post('/patient/register', registerPatient);
router.post('/patient/login',    loginPatient);
router.post('/patient/google',   googleAuthPatient);

// ── Doctor ────────────────────────────────────────────────────────────────────
router.post('/doctor/register', registerDoctor);
router.post('/doctor/login',    loginDoctor);
router.post('/doctor/google',   googleAuthDoctor);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post('/admin/register', protect, requireAdmin, registerAdmin);
router.post('/admin/login',    loginAdmin);

// ── Shared ────────────────────────────────────────────────────────────────────
router.post('/logout',  logout);
router.get('/verify',   verifyToken);

export default router;
