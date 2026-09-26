import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';

let xss;
try {
  const xssMod = await import('xss');
  xss = xssMod.default || xssMod;
} catch {
  xss = (str) => String(str).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<[^>]+>/g, '');
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory storage for file uploads
const storage = multer.memoryStorage();
const uploadOriginal = multer({ storage }); // Original: NO limits, NO fileFilter

let currentMode = 'before'; // 'before' (vulnerable) or 'after' (fixed)
let reports = [];

// Whitelists for fixed mode
const ALLOWED_REPORT_EXTS  = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
const MAX_REPORT_SIZE = 5 * 1024 * 1024; // 5 MB

// Endpoint to toggle mode between 'before' and 'after'
app.get('/api/mode', (req, res) => {
  res.json({ mode: currentMode });
});

app.post('/api/mode/:mode', (req, res) => {
  currentMode = req.params.mode === 'after' ? 'after' : 'before';
  res.json({ success: true, message: `Switched server to ${currentMode.toUpperCase()} mode`, mode: currentMode });
});

// Main reports endpoint
app.post('/api/reports', uploadOriginal.single('file'), (req, res) => {
  const mode = req.query.mode || req.headers['x-test-mode'] || currentMode;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  const { title, description, reportType } = req.body;

  // ==========================================
  // MODE 1: ORIGINAL VULNERABLE BEHAVIOR (BEFORE)
  // ==========================================
  if (mode === 'before') {
    if (!title) {
      return res.status(400).json({ success: false, message: 'Report title is required' });
    }

    const format = req.file.originalname?.split('.').pop() || null;
    const newReport = {
      _id: '6741b2a9f143a50012a45b91',
      patient: '673f8a12e874b30012d98c23',
      title: title, // Unsanitized: stores raw <script> / HTML directly
      description: description || null, // Unsanitized
      reportType: reportType || 'lab_report',
      fileUrl: `https://res.cloudinary.com/dhvmumahy/raw/upload/v1726000000/healthcare/patient-reports/${req.file.originalname}`,
      publicId: `healthcare/patient-reports/${req.file.originalname}`,
      fileFormat: format,
      createdAt: new Date().toISOString(),
    };

    reports.push(newReport);

    return res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      data: newReport,
    });
  }

  // ==========================================
  // MODE 2: FIXED SECURE BEHAVIOR (AFTER)
  // ==========================================
  const ext = path.extname(req.file.originalname || '').toLowerCase();

  // 1. File Size Validation (Max 5MB)
  if (req.file.size > MAX_REPORT_SIZE) {
    return res.status(400).json({
      success: false,
      code: 'FILE_TOO_LARGE',
      message: 'File size exceeds the 5MB limit. Please upload a smaller file.',
    });
  }

  // 2. MIME & Extension Whitelist Validation
  if (!ALLOWED_REPORT_EXTS.has(ext)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_FILE_TYPE',
      message: 'INVALID_FILE_TYPE: Only PDF, JPEG, PNG, and WebP files up to 5MB are permitted',
    });
  }

  // 3. Title Validation & Length Check
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Report title is required' });
  }

  if (title.trim().length > 120) {
    return res.status(400).json({ success: false, message: 'Report title cannot exceed 120 characters' });
  }

  // 4. XSS Sanitization
  const sanitize = (str, len = 1000) => {
    if (!str) return null;
    const clean = typeof xss === 'function' ? xss(str.trim().slice(0, len), { whiteList: {}, stripIgnoreTag: true }) : str.replace(/<[^>]*>?/gm, '').trim();
    return clean;
  };

  const sanitizedTitle = sanitize(title, 120);
  if (!sanitizedTitle) {
    return res.status(400).json({ success: false, message: 'Report title contains invalid or disallowed characters' });
  }

  const sanitizedDesc = description ? sanitize(description, 1000) : null;
  const safeFormat = ext.replace('.', '');

  const securedReport = {
    _id: '6741b2a9f143a50012a45b91',
    patient: '673f8a12e874b30012d98c23',
    title: sanitizedTitle, // Cleaned! No scripts or tags
    description: sanitizedDesc, // Cleaned!
    reportType: reportType || 'lab_report',
    fileUrl: `https://res.cloudinary.com/dhvmumahy/raw/upload/v1726000000/healthcare/patient-reports/secured_${safeFormat}`,
    publicId: `healthcare/patient-reports/secured_${safeFormat}`,
    fileFormat: safeFormat,
    createdAt: new Date().toISOString(),
  };

  return res.status(201).json({
    success: true,
    message: 'Report uploaded successfully',
    data: securedReport,
  });
});

app.get('/api/reports', (req, res) => {
  res.json({ success: true, count: reports.length, data: reports });
});

app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 TEST SERVER RUNNING ON: http://localhost:${PORT}`);
  console.log(`👉 Current Mode: ${currentMode.toUpperCase()}`);
  console.log(`📡 Ready for Postman: POST http://localhost:${PORT}/api/reports`);
  console.log(`=============================================================\n`);
});
