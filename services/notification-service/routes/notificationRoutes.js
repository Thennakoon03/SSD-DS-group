import express from 'express';
import { protect, requireRole, serviceAuth } from '../middlewares/authMiddleware.js';
import {
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentCompleted,
  notifyConsultationCompleted,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

// ── Internal endpoints (called by other microservices using SERVICE_SECRET) ─
router.post('/appointment-booked',      serviceAuth, notifyAppointmentBooked);
router.post('/appointment-confirmed',   serviceAuth, notifyAppointmentConfirmed);
router.post('/appointment-cancelled',   serviceAuth, notifyAppointmentCancelled);
router.post('/appointment-completed',   serviceAuth, notifyAppointmentCompleted);
router.post('/consultation-completed',  serviceAuth, notifyConsultationCompleted);

// ── User endpoints (require JWT) ────────────────────────────────────────────
router.get('/my',              protect, getMyNotifications);
router.get('/my/unread-count', protect, getUnreadCount);
router.put('/my/read-all',     protect, markAllAsRead);
router.put('/:id/read',        protect, markAsRead);

// ── Admin endpoints ─────────────────────────────────────────────────────────
router.get('/admin/all', protect, requireRole('admin'), getAllNotifications);

export default router;
