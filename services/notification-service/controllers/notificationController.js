import Notification from '../models/Notification.js';
import { sendEmail, appointmentBookedEmail, appointmentConfirmedEmail, appointmentCancelledEmail, appointmentCompletedEmail, consultationCompletedEmail } from '../utils/emailService.js';
import {
  sendSMS,
  appointmentBookedSMS,
  appointmentConfirmedSMS,
  appointmentCancelledSMS,
  appointmentCompletedSMS,
  consultationCompletedSMS,
} from '../utils/smsService.js';

// Internal helper 
 //Dispatch email + SMS for a recipient and persist to DB.
const dispatchNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  email,
  phone,
  emailHtml,
  smsText,
  referenceId,
  referenceType,
}) => {
  let emailSent = false, emailError = null;
  let smsSent   = false, smsError   = null;
  const fallbackPhone = process.env.TEXTLK_TEST_RECIPIENT || null;
  const targetPhone = phone || fallbackPhone;

  // Send email
  if (email && emailHtml) {
    const result = await sendEmail(email, title, emailHtml);
    emailSent  = result.success;
    emailError = result.error || null;
  }

  // Send SMS via Text.lk
  if (targetPhone && smsText) {
    if (!phone && fallbackPhone) {
      console.warn(`[Notification] Using TEXTLK_TEST_RECIPIENT fallback for recipientId=${recipientId}`);
    }
    const result = await sendSMS(targetPhone, smsText);
    smsSent  = result.success;
    smsError = result.error || null;
  } else if (smsText && !targetPhone) {
    smsError = 'Recipient phone is missing';
  }

  // Persist notification record
  const notification = await Notification.create({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    emailSent,
    emailError,
    smsSent,
    smsError,
    sentToEmail:   email  || null,
    sentToPhone:   smsText ? (targetPhone || null) : null,
    referenceId:   referenceId   || null,
    referenceType: referenceType || null,
  });

  return notification;
};

// appointment-booked
export const notifyAppointmentBooked = async (req, res) => {
  try {
    const { patient, doctor, appointment } = req.body;

    const date = new Date(appointment.appointmentDate).toDateString();
    const time = appointment.appointmentTime;
    const type = appointment.type;

    const templateData = {
      patientName: patient.name,
      doctorName:  doctor.name,
      date,
      time,
      type,
    };

    // Notify patient
    const patientNotif = await dispatchNotification({
      recipientId:   patient.id,
      recipientRole: 'patient',
      type:          'appointment_booked',
      title:         'Appointment Booked',
      message:       `Your appointment with Dr. ${doctor.name} on ${date} at ${time} has been booked.`,
      email:         patient.email,
      phone:         patient.phone,
      emailHtml:     appointmentBookedEmail({ recipientName: patient.name, ...templateData }),
      smsText:       appointmentBookedSMS({ recipientName: patient.name, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    // Notify doctor
    const doctorNotif = await dispatchNotification({
      recipientId:   doctor.id,
      recipientRole: 'doctor',
      type:          'appointment_booked',
      title:         'New Appointment Booked',
      message:       `Patient ${patient.name} has booked an appointment on ${date} at ${time}.`,
      email:         doctor.email,
      phone:         doctor.phone,
      emailHtml:     appointmentBookedEmail({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      smsText:       appointmentBookedSMS({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    res.status(201).json({ success: true, data: { patientNotif, doctorNotif } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// appointment-confirmed 
export const notifyAppointmentConfirmed = async (req, res) => {
  try {
    const { patient, doctor, appointment } = req.body;

    const date = new Date(appointment.appointmentDate).toDateString();
    const time = appointment.appointmentTime;
    const type = appointment.type;

    const templateData = { patientName: patient.name, doctorName: doctor.name, date, time, type };

    const patientNotif = await dispatchNotification({
      recipientId:   patient.id,
      recipientRole: 'patient',
      type:          'appointment_confirmed',
      title:         'Appointment Confirmed',
      message:       `Your appointment with Dr. ${doctor.name} on ${date} at ${time} has been confirmed.`,
      email:         patient.email,
      phone:         patient.phone,
      emailHtml:     appointmentConfirmedEmail({ recipientName: patient.name, ...templateData }),
      smsText:       appointmentConfirmedSMS({ recipientName: patient.name, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    const doctorNotif = await dispatchNotification({
      recipientId:   doctor.id,
      recipientRole: 'doctor',
      type:          'appointment_confirmed',
      title:         'Appointment Confirmed',
      message:       `Appointment with patient ${patient.name} on ${date} at ${time} has been confirmed.`,
      email:         doctor.email,
      phone:         doctor.phone,
      emailHtml:     appointmentConfirmedEmail({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      smsText:       appointmentConfirmedSMS({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    res.status(201).json({ success: true, data: { patientNotif, doctorNotif } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// appointment-cancelled 
export const notifyAppointmentCancelled = async (req, res) => {
  try {
    const { patient, doctor, appointment, cancelledBy, cancellationReason } = req.body;

    const date = new Date(appointment.appointmentDate).toDateString();
    const time = appointment.appointmentTime;

    const templateData = {
      patientName: patient.name,
      doctorName:  doctor.name,
      date,
      time,
      cancelledBy,
      reason: cancellationReason,
    };

    const patientNotif = await dispatchNotification({
      recipientId:   patient.id,
      recipientRole: 'patient',
      type:          'appointment_cancelled',
      title:         'Appointment Cancelled',
      message:       `Your appointment with Dr. ${doctor.name} on ${date} at ${time} has been cancelled.`,
      email:         patient.email,
      phone:         patient.phone,
      emailHtml:     appointmentCancelledEmail({ recipientName: patient.name, ...templateData }),
      smsText:       appointmentCancelledSMS({ recipientName: patient.name, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    const doctorNotif = await dispatchNotification({
      recipientId:   doctor.id,
      recipientRole: 'doctor',
      type:          'appointment_cancelled',
      title:         'Appointment Cancelled',
      message:       `Appointment with patient ${patient.name} on ${date} at ${time} has been cancelled.`,
      email:         doctor.email,
      phone:         doctor.phone,
      emailHtml:     appointmentCancelledEmail({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      smsText:       appointmentCancelledSMS({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    res.status(201).json({ success: true, data: { patientNotif, doctorNotif } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// appointment-completed
export const notifyAppointmentCompleted = async (req, res) => {
  try {
    const { patient, doctor, appointment } = req.body;

    const date = new Date(appointment.appointmentDate).toDateString();
    const templateData = { patientName: patient.name, doctorName: doctor.name, date };

    const patientNotif = await dispatchNotification({
      recipientId:   patient.id,
      recipientRole: 'patient',
      type:          'appointment_completed',
      title:         'Appointment Completed',
      message:       `Your appointment with Dr. ${doctor.name} has been completed.`,
      email:         patient.email,
      phone:         patient.phone,
      emailHtml:     appointmentCompletedEmail({ recipientName: patient.name, ...templateData }),
      smsText:       appointmentCompletedSMS({ recipientName: patient.name, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    const doctorNotif = await dispatchNotification({
      recipientId:   doctor.id,
      recipientRole: 'doctor',
      type:          'appointment_completed',
      title:         'Appointment Completed',
      message:       `Appointment with patient ${patient.name} has been completed.`,
      email:         doctor.email,
      phone:         doctor.phone,
      emailHtml:     appointmentCompletedEmail({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      smsText:       appointmentCompletedSMS({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      referenceId:   appointment._id,
      referenceType: 'appointment',
    });

    res.status(201).json({ success: true, data: { patientNotif, doctorNotif } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// consultation-completed 
export const notifyConsultationCompleted = async (req, res) => {
  try {
    const { patient, doctor, session } = req.body;
    const durationMinutes = session.durationMinutes || null;

    const templateData = { patientName: patient.name, doctorName: doctor.name, durationMinutes };

    const patientNotif = await dispatchNotification({
      recipientId:   patient.id,
      recipientRole: 'patient',
      type:          'consultation_completed',
      title:         'Video Consultation Completed',
      message:       `Your video consultation with Dr. ${doctor.name} has been completed.`,
      email:         patient.email,
      phone:         patient.phone,
      emailHtml:     consultationCompletedEmail({ recipientName: patient.name, ...templateData }),
      referenceId:   session._id,
      referenceType: 'session',
    });

    const doctorNotif = await dispatchNotification({
      recipientId:   doctor.id,
      recipientRole: 'doctor',
      type:          'consultation_completed',
      title:         'Video Consultation Completed',
      message:       `Video consultation with patient ${patient.name} has been completed.`,
      email:         doctor.email,
      phone:         doctor.phone,
      emailHtml:     consultationCompletedEmail({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      smsText:       consultationCompletedSMS({ recipientName: `Dr. ${doctor.name}`, ...templateData }),
      referenceId:   session._id,
      referenceType: 'session',
    });

    res.status(201).json({ success: true, data: { patientNotif, doctorNotif } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Returns notifications for the authenticated user
export const getMyNotifications = async (req, res) => {
  try {
    const { id } = req.user;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query = { recipientId: id };
    if (unreadOnly === 'true') query.isRead = false;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.user.id, isRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    if (notification.recipientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/notifications/my/read-all ────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/notifications/admin/all ─────────────────────────────────────
export const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 30, type, recipientRole } = req.query;
    const query = {};
    if (type)          query.type          = type;
    if (recipientRole) query.recipientRole = recipientRole;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
