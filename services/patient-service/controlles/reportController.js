import Report from '../models/Report.js';
import cloudinary from '../config/cloudinaryConfig.js';
import xss from 'xss';

const ALLOWED_REPORT_TYPES = ['lab_report', 'prescription', 'scan', 'discharge_summary', 'other'];
const ALLOWED_FORMATS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

/**
 * Strips all HTML tags, script elements, and dangerous event handlers from untrusted text.
 */
const sanitizeInput = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  const trimmed = str.trim().slice(0, maxLength);
  return xss(trimmed, {
    whiteList: {}, // Disallow all HTML tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'xml', 'iframe', 'object', 'embed'],
  });
};

// Upload a medical report with strict validation and XSS sanitization
export const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const { title, description, reportType } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Report title is required' });
    }

    if (title.trim().length > 120) {
      return res.status(400).json({ success: false, message: 'Report title cannot exceed 120 characters' });
    }

    const sanitizedTitle = sanitizeInput(title, 120);
    if (!sanitizedTitle) {
      return res.status(400).json({ success: false, message: 'Report title contains invalid or disallowed characters' });
    }

    let sanitizedDescription = null;
    if (description && typeof description === 'string' && description.trim()) {
      if (description.trim().length > 1000) {
        return res.status(400).json({ success: false, message: 'Description cannot exceed 1000 characters' });
      }
      sanitizedDescription = sanitizeInput(description, 1000);
    }

    const chosenType = (reportType && ALLOWED_REPORT_TYPES.includes(reportType.trim()))
      ? reportType.trim()
      : 'lab_report';

    const rawFormat = (req.file.originalname?.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileFormat = ALLOWED_FORMATS.includes(rawFormat) ? rawFormat : 'pdf';

    const report = await Report.create({
      patient: req.user.id,
      title: sanitizedTitle,
      description: sanitizedDescription,
      reportType: chosenType,
      fileUrl: req.file.path,     
      publicId: req.file.filename,   
      fileFormat,
    });

    res.status(201).json({ success: true, message: 'Report uploaded successfully', data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reports for logged-in patient
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ patient: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single report by ID 
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Only the owning patient can view their report
    if (report.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update report metadata with XSS sanitization and type enforcement
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, description, reportType } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Report title cannot be empty' });
      }
      if (title.trim().length > 120) {
        return res.status(400).json({ success: false, message: 'Report title cannot exceed 120 characters' });
      }
      const sanitizedTitle = sanitizeInput(title, 120);
      if (!sanitizedTitle) {
        return res.status(400).json({ success: false, message: 'Report title contains invalid or disallowed characters' });
      }
      report.title = sanitizedTitle;
    }

    if (description !== undefined) {
      if (typeof description === 'string' && description.trim()) {
        if (description.trim().length > 1000) {
          return res.status(400).json({ success: false, message: 'Description cannot exceed 1000 characters' });
        }
        report.description = sanitizeInput(description, 1000);
      } else {
        report.description = null;
      }
    }

    if (typeof reportType === 'string' && reportType.trim()) {
      const normalizedType = reportType.trim();
      if (!ALLOWED_REPORT_TYPES.includes(normalizedType)) {
        return res.status(400).json({ success: false, message: 'Invalid report type' });
      }
      report.reportType = normalizedType;
    }

    // If a new file is uploaded, replace cloud metadata and best-effort cleanup old file.
    if (req.file) {
      const rawFormat = (req.file.originalname?.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fileFormat = ALLOWED_FORMATS.includes(rawFormat) ? rawFormat : 'pdf';

      const oldPublicId = report.publicId;
      report.fileUrl = req.file.path;
      report.publicId = req.file.filename;
      report.fileFormat = fileFormat;

      if (oldPublicId && oldPublicId !== report.publicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch {
          // Non-blocking cleanup failure for old file.
        }
      }
    }

    await report.save();

    res.json({ success: true, message: 'Report updated successfully', data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a report 
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete file from Cloudinary
    await cloudinary.uploader.destroy(report.publicId);

    await Report.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal — get all reports for a patient (called by doctor-service)
export const getReportsByPatientId = async (req, res) => {
  try {
    const reports = await Report.find({ patient: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal — get a single report by ID (called by doctor-service)
export const getReportByIdInternal = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
