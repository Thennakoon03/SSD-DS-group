import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipientId:   { type: String, required: true },
    recipientRole: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },

    // Notification type
    type: {
      type: String,
      enum: [
        'appointment_booked',
        'appointment_confirmed',
        'appointment_cancelled',
        'appointment_completed',
        'consultation_completed',
      ],
      required: true,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // Delivery channels
    emailSent:  { type: Boolean, default: false },
    emailError: { type: String, default: null },
    smsSent:    { type: Boolean, default: false },
    smsError:   { type: String, default: null },

    // Read status
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },

    // Reference to the related resource
    referenceId:   { type: String, default: null }, // appointmentId or sessionId
    referenceType: { type: String, enum: ['appointment', 'session', null], default: null },

    // Contact used at time of sending (for record)
    sentToEmail: { type: String, default: null },
    sentToPhone: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for fast per-user lookups
notificationSchema.index({ recipientId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
