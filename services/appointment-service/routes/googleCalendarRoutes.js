import express from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getConnectionStatus,
  disconnectGoogleCalendar,
} from '../controllers/googleCalendarController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/connect',    protect, getGoogleAuthUrl);
router.post('/callback',  protect, handleGoogleCallback);
router.get('/status',     protect, getConnectionStatus);
router.delete('/disconnect', protect, disconnectGoogleCalendar);

export default router;
