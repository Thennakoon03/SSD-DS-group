import mongoose from 'mongoose';
import { adminConn } from '../config/dbConfig.js';

const revokedTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

export default adminConn.model('RevokedToken', revokedTokenSchema);
