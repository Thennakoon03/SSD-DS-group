import Appointment from '../models/Appointment.js';
import axios from 'axios';
import cloudinary from '../config/cloudinaryConfig.js';

// ── Notification helper ────────────────────────────────────────────────────
// Fire-and-forget: never blocks or fails the main operation

const NOTIFICATION_URL = () =>
  `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'}/api/notifications`;

const notifyAsync = (endpoint, payload) => {
  axios
    .post(`${NOTIFICATION_URL()}/${endpoint}`, payload, {
      headers: { 'x-service-secret': process.env.SERVICE_SECRET },
    })
    .catch((err) => {
      const detail = err.response?.data || err.message;
      console.error(`[Notification] Failed to call ${endpoint}:`, detail);
    });
};

// Fetch patient info; returns { id, name, email, phone } with safe fallbacks
const getPatientInfo = async (patientId, fallbackName) => {
  try {
    const PATIENT_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
    const serviceKey  = process.env.SERVICE_SECRET_KEY || process.env.SERVICE_SECRET;
    const res = await axios.get(`${PATIENT_URL}/api/patients/${patientId}`, {
      headers: { 'x-service-key': serviceKey },
    });
    const p    = res.data.data;
    const name = (p.firstName && p.lastName)
      ? `${p.firstName} ${p.lastName}`
      : (p.name || fallbackName || 'Patient');
    return { id: patientId, name, email: p.email || null, phone: p.phone || null };
  } catch {
    return { id: patientId, name: fallbackName || 'Patient', email: null, phone: null };
  }
};

// Fetch doctor info; returns { id, name, email, phone } with safe fallbacks
const getDoctorInfo = async (doctorId, fallbackName) => {
  try {
    const DOCTOR_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
    const res = await axios.get(`${DOCTOR_URL}/api/doctors/${doctorId}`);
    const d   = res.data.data;
    const name = (d.firstName && d.lastName)
      ? `${d.firstName} ${d.lastName}`
      : (d.name || fallbackName || 'Doctor');
    return { id: doctorId, name, email: d.email || null, phone: d.phone || null };
  } catch {
    return { id: doctorId, name: fallbackName || 'Doctor', email: null, phone: null };
  }
};

// Patient: Book an appointment
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, doctorName, patientName, appointmentDate, appointmentTime, type, reason, attachedReports } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'doctorId, appointmentDate, and appointmentTime are required' });
    }

    // Reject past dates
    if (new Date(appointmentDate) < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ success: false, message: 'Appointment date must be today or in the future' });
    }

    // Verify doctor exists and is available — also grab their name and fee
    let resolvedDoctorName = doctorName || null;
    let resolvedConsultationFee = 0;
    try {
      const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
      const doctorRes = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);
      const d = doctorRes.data.data;
      if (!d.isAvailable) {
        return res.status(400).json({ success: false, message: 'Doctor is not currently available' });
      }
      if (!resolvedDoctorName && (d.firstName || d.lastName)) {
        resolvedDoctorName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
      }
      resolvedConsultationFee = d.consultationFee || 0;
    } catch {
      return res.status(404).json({ success: false, message: 'Doctor not found or unavailable' });
    }

    // If patientName wasn't supplied by the frontend, fetch it from patient-service
    let resolvedPatientName = patientName || null;
    if (!resolvedPatientName) {
      const p = await getPatientInfo(req.user.id, null);
      if (p.name && p.name !== 'Patient') resolvedPatientName = p.name;
    }

    // Prevent double-booking: same doctor, same date+time, not cancelled
    const conflict = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }

    const appointment = await Appointment.create({
      patientId:   req.user.id,
      doctorId,
      patientName: resolvedPatientName,
      doctorName:  resolvedDoctorName,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      duration:        30,
      type:            type || 'in_person',
      reason:          reason || null,
      consultationFee: resolvedConsultationFee,
      attachedReports: Array.isArray(attachedReports) ? attachedReports : [],
    });

    // Fire-and-forget notifications
    (async () => {
      const [patient, doctor] = await Promise.all([
        getPatientInfo(req.user.id, patientName),
        getDoctorInfo(doctorId, doctorName),
      ]);
      notifyAsync('appointment-booked', { patient, doctor, appointment });
    })();

    res.status(201).json({ success: true, message: 'Appointment booked successfully', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Patient: Get own appointments 
export const getMyAppointmentsAsPatient = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id }).sort({ appointmentDate: -1 });

    // Enrich any appointment that is missing a doctorName
    const enriched = await Promise.all(
      appointments.map(async (appt) => {
        if (appt.doctorName) return appt;
        try {
          const doctor = await getDoctorInfo(appt.doctorId, null);
          if (doctor.name && doctor.name !== 'Doctor') {
            appt.doctorName = doctor.name;
            await appt.save(); // persist so future calls don't re-fetch
          }
        } catch { /* ignore */ }
        return appt;
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor: Get own appointments
export const getMyAppointmentsAsDoctor = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id }).sort({ appointmentDate: -1 });

    // Enrich any appointment that is missing a patientName
    const enriched = await Promise.all(
      appointments.map(async (appt) => {
        if (appt.patientName) return appt;
        try {
          const patient = await getPatientInfo(appt.patientId, null);
          if (patient.name && patient.name !== 'Patient') {
            appt.patientName = patient.name;
            await appt.save(); // persist so future calls don't re-fetch
          }
        } catch { /* ignore */ }
        return appt;
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Patient or Doctor: Get single appointment 
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only the patient or doctor involved can view it
    const isPatient = req.user.role === 'patient' && appointment.patientId === req.user.id;
    const isDoctor  = req.user.role === 'doctor'  && appointment.doctorId  === req.user.id;
    const isAdmin   = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor: Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['confirmed', 'completed', 'no_show'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update a cancelled appointment' });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    // Fire-and-forget notifications
    if (status === 'confirmed' || status === 'completed') {
      const notifEndpoint = status === 'confirmed' ? 'appointment-confirmed' : 'appointment-completed';
      (async () => {
        const [patient, doctor] = await Promise.all([
          getPatientInfo(appointment.patientId, appointment.patientName),
          getDoctorInfo(appointment.doctorId, appointment.doctorName),
        ]);
        notifyAsync(notifEndpoint, { patient, doctor, appointment });
      })();
    }

    res.json({ success: true, message: 'Appointment status updated', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Patient or Doctor: Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const isPatient = req.user.role === 'patient' && appointment.patientId === req.user.id;
    const isDoctor  = req.user.role === 'doctor'  && appointment.doctorId  === req.user.id;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed appointment' });
    }

    appointment.status             = 'cancelled';
    appointment.cancelledBy        = req.user.role;
    appointment.cancellationReason = cancellationReason || null;

    await appointment.save();

    // Fire-and-forget notifications
    (async () => {
      const [patient, doctor] = await Promise.all([
        getPatientInfo(appointment.patientId, appointment.patientName),
        getDoctorInfo(appointment.doctorId, appointment.doctorName),
      ]);
      notifyAsync('appointment-cancelled', {
        patient,
        doctor,
        appointment,
        cancelledBy:        req.user.role,
        cancellationReason: cancellationReason || null,
      });
    })();

    res.json({ success: true, message: 'Appointment cancelled', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Patient: Delete own cancelled appointment
export const deleteCancelledAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Only cancelled appointments can be deleted' });
    }

    await appointment.deleteOne();

    res.json({ success: true, message: 'Cancelled appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor: Add/update notes on a completed appointment
export const addNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ success: false, message: 'Notes are required' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    appointment.notes = notes;
    await appointment.save();

    res.json({ success: true, message: 'Notes saved', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ appointmentDate: -1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal (payment-service): Update payment status on an appointment
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const allowed = ['pending', 'paid', 'refunded'];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: `paymentStatus must be one of: ${allowed.join(', ')}` });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.paymentStatus = paymentStatus;
    if (paymentMethod) appointment.paymentMethod = paymentMethod;
    await appointment.save();

    res.json({ success: true, message: 'Payment status updated', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal (payment-service): Get appointment status snapshot
export const getAppointmentStatusInternal = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).select('status paymentStatus');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      data: {
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Patient: mark own appointment as cash payment (pay at hospital/clinic)
export const markPaymentCash = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Appointment is already paid' });
    }

    appointment.paymentMethod = 'cash';
    appointment.cashPaymentRequested = true;
    await appointment.save();

    res.json({ success: true, message: 'Marked as cash payment', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Patient: mark own appointment as paid (called directly from frontend after Stripe confirms)
export const markPaymentPaid = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Idempotent — no error if already paid
    appointment.paymentStatus = 'paid';
    if (!appointment.paymentMethod) appointment.paymentMethod = 'card';
    await appointment.save();

    res.json({ success: true, message: 'Payment marked as paid', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor: Upload prescription for a completed appointment
export const uploadPrescription = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Prescription can only be uploaded for completed appointments' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // If there was a previous prescription on Cloudinary, delete it
    if (appointment.prescription?.fileUrl) {
      try {
        const urlParts  = appointment.prescription.fileUrl.split('/');
        const filename  = urlParts[urlParts.length - 1];
        const publicId  = `healthcare/prescriptions/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
      } catch { /* ignore – old file cleanup is best-effort */ }
    }

    appointment.prescription = {
      fileUrl:    req.file.path,
      uploadedAt: new Date(),
      notes:      req.body.notes || null,
    };

    await appointment.save();

    res.json({ success: true, message: 'Prescription uploaded successfully', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor: Delete prescription from a completed appointment
export const deletePrescription = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!appointment.prescription?.fileUrl) {
      return res.status(404).json({ success: false, message: 'No prescription to delete' });
    }

    // Delete from Cloudinary
    try {
      const urlParts = appointment.prescription.fileUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `healthcare/prescriptions/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    } catch { /* ignore */ }

    appointment.prescription = { fileUrl: null, uploadedAt: null, notes: null };
    await appointment.save();

    res.json({ success: true, message: 'Prescription deleted', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
