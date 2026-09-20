import mongoose from 'mongoose';
import { doctorConn } from '../config/dbConfig.js';

// Minimal schema — bound to DoctorServiceDB so it reads/writes the same collection
// as doctor-service. Only auth-relevant fields are defined.
const doctorSchema = new mongoose.Schema(
  {
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:     { type: String, required: true, minlength: 8, select: false },
    role:         { type: String, enum: ['doctor'], default: 'doctor' },
    profileImage: { type: String, default: null },
    isActive:     { type: Boolean, default: true },
    isVerified:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default doctorConn.model('Doctor', doctorSchema);
