import axios from 'axios';

// GET /api/doctors/patients/:patientId
// Doctor views basic + medical details of a patient
export const getPatientDetails = async (req, res) => {
  try {
    const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
    const SERVICE_KEY = process.env.SERVICE_SECRET_KEY;

    const response = await axios.get(
      `${PATIENT_SERVICE_URL}/api/patients/${req.params.patientId}`,
      { headers: { 'x-service-key': SERVICE_KEY } }
    );

    res.json(response.data);
  } catch (error) {
    const status  = error.response?.status  || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ success: false, message });
  }
};

// GET /api/doctors/patients/:patientId/reports
// Doctor views all reports for a specific patient
export const getPatientReports = async (req, res) => {
  try {
    const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
    const SERVICE_KEY = process.env.SERVICE_SECRET_KEY;

    const response = await axios.get(
      `${PATIENT_SERVICE_URL}/api/reports/internal/patient/${req.params.patientId}`,
      { headers: { 'x-service-key': SERVICE_KEY } }
    );

    res.json(response.data);
  } catch (error) {
    const status  = error.response?.status  || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ success: false, message });
  }
};

// GET /api/doctors/patients/:patientId/reports/:reportId
// Doctor views a single report
export const getPatientReportById = async (req, res) => {
  try {
    const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
    const SERVICE_KEY = process.env.SERVICE_SECRET_KEY;

    const response = await axios.get(
      `${PATIENT_SERVICE_URL}/api/reports/internal/${req.params.reportId}`,
      { headers: { 'x-service-key': SERVICE_KEY } }
    );

    res.json(response.data);
  } catch (error) {
    const status  = error.response?.status  || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ success: false, message });
  }
};
