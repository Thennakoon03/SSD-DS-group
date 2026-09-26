import axios from 'axios';

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
const SERVICE_SECRET = process.env.SERVICE_SECRET_KEY;

// Must run after `protect`. Confirms the authenticated doctor has a permitted
// appointment relationship (pending/confirmed/completed) with the requested
// patient before allowing access to that patient's profile or reports.
// Fails closed: any ambiguous or failed check blocks access.
export const authorizePatientAccess = async (req, res, next) => {
  const doctorId  = req.user.id;
  const patientId = req.params.patientId;

  try {
    const url =
      `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/access/doctor/` +
      `${encodeURIComponent(doctorId)}/patient/${encodeURIComponent(patientId)}`;

    const response = await axios.get(url, {
      headers: { 'x-service-secret': SERVICE_SECRET },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.authorized === true) {
      return next();
    }

    if (response.status === 403) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(503).json({ success: false, message: 'Authorization service unavailable' });
  } catch {
    return res.status(503).json({ success: false, message: 'Authorization service unavailable' });
  }
};
