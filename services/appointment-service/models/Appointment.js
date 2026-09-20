import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId:{ type: String, required: true },
    doctorId:{ type: String, required: true },
    patientName:{ type: String, default: null },
    doctorName:{ type: String, default: null },
    appointmentDate:{ type: Date, required: true },
    appointmentTime:{ type: String, required: true }, 
    duration:{ type: Number, default: 30 },    
    type: {type: String, enum: ['in_person', 'telemedicine'],default: 'in_person'},
    status: {type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'not_responded'],default: 'pending' },
    reason:{ type: String, default: null }, 
    notes:{ type: String, default: null },
    cancellationReason:{ type: String, default: null },
    cancelledBy:{ type: String, enum: ['patient', 'doctor', null], default: null },
    consultationFee: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['card', 'cash', null], default: 'cash' },
    cashPaymentRequested: { type: Boolean, default: false },
    attachedReports: [
      {
        reportId:   { type: String },
        title:      { type: String },
        fileUrl:    { type: String },
        reportType: { type: String },
      },
    ],
    prescription: {
      fileUrl:     { type: String, default: null },
      uploadedAt:  { type: Date,   default: null },
      notes:       { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
