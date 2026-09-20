import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import {
  createSession,
  getUserSessions,
  getSession,
  getSessionByAppointment,
  generateToken,
  joinSession,
  endSession,
  cancelSession,
} from '../controllers/telemedicineController.js';

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

//Session CRUD 
router.post('/sessions', requireRole('doctor', 'patient'), createSession);
router.get('/sessions', getUserSessions);
router.get('/sessions/appointment/:appointmentId', getSessionByAppointment);
router.get('/sessions/:sessionId', getSession);

//Session lifecycle

//get Agora RTC token
router.post('/sessions/:sessionId/token', generateToken);

//mark session active
router.put('/sessions/:sessionId/join', joinSession);

//end session
router.put('/sessions/:sessionId/end', endSession);

//cancel scheduled session
router.put('/sessions/:sessionId/cancel', requireRole('doctor', 'patient', 'admin'), cancelSession);

export default router;
