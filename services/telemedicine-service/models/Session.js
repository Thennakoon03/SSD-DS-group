import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    appointmentId:{ type: String, required: true, unique: true },
    patientId:{ type: String, required: true },
    doctorId:{ type: String, required: true },
    channelName:{ type: String, required: true, unique: true },
    status:{type: String, enum: ['scheduled', 'active', 'ended', 'cancelled'],default: 'scheduled'},
    scheduledAt: { type: Date, required: true },
    startedAt:{ type: Date, default: null },
    endedAt:{ type: Date, default: null },
    durationMinutes:{ type: Number, default: null },
    notes:{ type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
