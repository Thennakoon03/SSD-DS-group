import mongoose from 'mongoose';
import { adminConn } from '../config/dbConfig.js';

// Minimal schema — bound to AdminServiceDB so it reads/writes the same collection
// as admin-service. Only auth-relevant fields are defined.
const adminSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role:     { type: String, enum: ['admin'], default: 'admin' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default adminConn.model('Admin', adminSchema);
