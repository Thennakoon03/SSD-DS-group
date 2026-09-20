import express from 'express';
import {
  bookAppointment,
  getMyAppointmentsAsPatient,
  getMyAppointmentsAsDoctor,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  deleteCancelledAppointment,
  addNotes,
  getAllAppointments,
  updatePaymentStatus,
  getAppointmentStatusInternal,
  markPaymentCash,
  markPaymentPaid,
  uploadPrescription,
  deletePrescription,
} from '../controllers/appointmentController.js';
import { protect, requireRole, serviceAuth } from '../middlewares/authMiddleware.js';
import { uploadPrescriptionFile } from '../config/cloudinaryConfig.js';

const router = express.Router();

// Admin — must be before /:id
router.get('/admin/all', protect, requireRole('admin'), getAllAppointments);

// Patient routes
router.post('/', protect, requireRole('patient'), bookAppointment);
router.get('/my', protect, requireRole('patient'), getMyAppointmentsAsPatient);
router.delete('/:id', protect, requireRole('patient'), deleteCancelledAppointment);

// Doctor routes
router.get('/doctor/my', protect, requireRole('doctor'), getMyAppointmentsAsDoctor);
router.put('/:id/status', protect, requireRole('doctor'), updateAppointmentStatus);
router.put('/:id/notes', protect, requireRole('doctor'), addNotes);
router.post('/:id/prescription', protect, requireRole('doctor'), uploadPrescriptionFile.single('prescription'), uploadPrescription);
router.delete('/:id/prescription', protect, requireRole('doctor'), deletePrescription);

// Shared patient + doctor routes
router.get('/:id', protect, getAppointmentById);
router.put('/:id/cancel', protect, cancelAppointment);

// Patient: mark own appointment paid after Stripe confirms
router.put('/:id/mark-paid', protect, requireRole('patient'), markPaymentPaid);
router.put('/:id/mark-cash', protect, requireRole('patient'), markPaymentCash);

// Internal — called by payment-service only
router.get('/internal/:id/status', serviceAuth, getAppointmentStatusInternal);
router.put('/:id/payment-status', serviceAuth, updatePaymentStatus);

export default router;
