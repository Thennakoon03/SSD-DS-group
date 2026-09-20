import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true },
    patientId:     { type: String, required: true },
    doctorId:      { type: String, required: true },

    // Stripe fields
    stripePaymentIntentId: { type: String, required: true, unique: true },
    stripeClientSecret:    { type: String, required: true },

    amount:    { type: Number, required: true }, // USD cents charged to Stripe
    amountLkr: { type: Number, default: 0 },     // original LKR amount for display
    currency:  { type: String, default: 'usd' },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },

    // Populated when Stripe webhook confirms payment
    stripeChargeId:      { type: String, default: null },
    stripePaymentMethod: { type: String, default: null }, // card brand e.g. visa
    receiptUrl:          { type: String, default: null },

    itemName: { type: String, default: 'Consultation Fee' },
  },
  { timestamps: true }
);

paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
