import express from 'express';
import { uploadReport, getMyReports, getReportById, updateReport, deleteReport, getReportsByPatientId, getReportByIdInternal } from '../controlles/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { serviceProtect } from '../middlewares/serviceMiddleware.js';
import { handleReportUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, handleReportUpload, uploadReport);
router.get('/', protect, getMyReports);

// Internal service-to-service routes (doctor-service / admin-service) — must be before /:id
router.get('/internal/patient/:patientId', serviceProtect, getReportsByPatientId);
router.get('/internal/patient/:patientId/:reportId', serviceProtect, getReportByIdInternal);

router.get('/:id', protect, getReportById);
router.put('/:id', protect, handleReportUpload, updateReport);
router.delete('/:id', protect, deleteReport);

export default router;
