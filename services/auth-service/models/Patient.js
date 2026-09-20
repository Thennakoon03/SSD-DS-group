import mongoose from 'mongoose';
import { patientConn } from '../config/dbConfig.js';

// Minimal schema — bound to PatientServiceDB so it reads/writes the same collection
// as patient-service. Only auth-relevant fields are defined.
const patientSchema = new mongoose.Schema(
  {
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:     { type: String, required: true, minlength: 8, select: false },
    role:         { type: String, enum: ['patient'], default: 'patient' },
    profileImage: { type: String, default: null },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default patientConn.model('Patient', patientSchema);
