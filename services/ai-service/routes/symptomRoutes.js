import { Router } from 'express';
import { checkSymptoms, getHistory, deleteCheck } from '../controllers/symptomController.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// POST  /api/ai/symptom-check       — check symptoms (saves if authenticated)
router.post('/symptom-check', optionalAuth, checkSymptoms);

// GET   /api/ai/symptom-check/history — patient's history (requires auth)
router.get('/symptom-check/history', protect, getHistory);

// DELETE /api/ai/symptom-check/:id  — delete a check (requires auth)
router.delete('/symptom-check/:id', protect, deleteCheck);

export default router;
