import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import {
  createPaymentIntent,
  stripeWebhook,
  confirmTestPayment,
  adminMarkCashPaid,
  adminMarkRefunded,
  getPaymentByAppointment,
  getMyPayments,
  getMyPaymentsAsDoctor,
  getPaymentById,
  getAllPayments,
} from '../controllers/paymentController.js';

const router = express.Router();

// ── Stripe webhook (raw body — must be before express.json()) ────────────────
// Mounted separately in server.js with express.raw()
// router.post('/webhook', stripeWebhook);  ← handled in server.js

// ── Patient routes (require JWT) ─────────────────────────────────────────────
router.post('/create-intent',  protect, requireRole('patient'), createPaymentIntent);
router.post('/confirm-test',   protect, requireRole('patient'), confirmTestPayment);
router.get('/my',              protect, requireRole('patient'), getMyPayments);
router.get('/appointment/:appointmentId', protect, getPaymentByAppointment);

// ── Doctor routes ─────────────────────────────────────────────────────────────
router.get('/doctor/my', protect, requireRole('doctor'), getMyPaymentsAsDoctor);

// ── Admin routes (before /:id to avoid shadowing) ────────────────────────────
router.get('/admin/all', protect, requireRole('admin'), getAllPayments);
router.put('/admin/:appointmentId/mark-cash-paid', protect, requireRole('admin'), adminMarkCashPaid);
router.put('/admin/:appointmentId/mark-refunded', protect, requireRole('admin'), adminMarkRefunded);

// ── Shared (must be last — wildcard matches any id) ───────────────────────────
router.get('/:id', protect, getPaymentById);

export default router;
