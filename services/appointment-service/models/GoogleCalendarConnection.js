import mongoose from 'mongoose';

const googleCalendarConnectionSchema = new mongoose.Schema(
  {
    userId:       { type: String, required: true },
    role:         { type: String, enum: ['patient', 'doctor'], required: true },
    // Access token is short-lived; kept encrypted at rest like the refresh token.
    accessToken:  { type: String, required: true },
    refreshToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true },
    scope:        { type: String, default: null },
  },
  { timestamps: true }
);

googleCalendarConnectionSchema.index({ userId: 1, role: 1 }, { unique: true });

export default mongoose.model('GoogleCalendarConnection', googleCalendarConnectionSchema);
