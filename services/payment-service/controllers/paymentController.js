import Stripe from 'stripe';
import axios from 'axios';
import Payment from '../models/Payment.js';

const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// ── POST /api/payments/create-intent ─────────────────────────────────────────
/**
 * Patient initiates payment. Creates a Stripe PaymentIntent.
 * Body: { appointmentId, doctorId, amountLkr (LKR value e.g. 3500), itemName? }
 * Fetches live LKR→USD rate, converts to USD cents for Stripe.
 * Returns: { clientSecret, paymentIntentId, amountLkr, amountUsdCents }
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const {
      appointmentId,
      doctorId,
      amountLkr,       // LKR amount e.g. 3500
      itemName = 'Consultation Fee',
    } = req.body;

    if (!appointmentId || !doctorId || !amountLkr) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, doctorId, and amountLkr are required',
      });
    }

    // ── Fetch live LKR → USD exchange rate ──────────────────────────────────
    let lkrPerUsd = 320; // safe fallback
    try {
      const rateRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
      lkrPerUsd = rateRes.data?.rates?.LKR || lkrPerUsd;
    } catch {
      console.warn('[Payment] Exchange rate fetch failed, using fallback 320 LKR/USD');
    }

    // Convert LKR → USD cents (Stripe smallest unit)
    const amountUsdCents = Math.max(50, Math.round((amountLkr / lkrPerUsd) * 100)); // min $0.50
    const exchangeRate   = lkrPerUsd;

    // Prevent duplicate pending/completed payments for the same appointment
    const existing = await Payment.findOne({
      appointmentId,
      status: { $in: ['pending', 'completed'] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A payment already exists for this appointment',
        data: { clientSecret: existing.stripeClientSecret, paymentIntentId: existing.stripePaymentIntentId },
      });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe().paymentIntents.create({
      amount:   amountUsdCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        appointmentId,
        patientId: req.user.id,
        doctorId,
        itemName,
        amountLkr,
        exchangeRate,
      },
    });

    // Persist to DB
    const payment = await Payment.create({
      appointmentId,
      patientId: req.user.id,
      doctorId,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret:    paymentIntent.client_secret,
      amount:    amountUsdCents,
      amountLkr,
      currency:  'usd',
      status: 'pending',
      itemName,
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId:       payment._id,
        clientSecret:    paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountLkr,
        amountUsdCents,
        exchangeRate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/payments/webhook ────────────────────────────────────────────────
/**
 * Stripe webhook — listens for payment_intent.succeeded / payment_intent.payment_failed.
 * Requires raw body (handled in server.js with express.raw() before this route).
 * Set webhook endpoint in Stripe Dashboard → Developers → Webhooks.
 * For local dev use: stripe listen --forward-to localhost:3008/api/payments/webhook
 */
export const stripeWebhook = async (req, res) => {
  const sig           = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const intent = event.data.object;

  try {
    if (event.type === 'payment_intent.succeeded') {
      const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
      if (payment) {
        payment.status            = 'completed';
        payment.stripeChargeId    = intent.latest_charge || null;
        payment.stripePaymentMethod = intent.payment_method_types?.[0] || null;
        await payment.save();

        // Update appointment paymentStatus in appointment-service
        const APPT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
        axios
          .put(
            `${APPT_URL}/api/appointments/${payment.appointmentId}/payment-status`,
            { paymentStatus: 'paid', paymentMethod: 'card' },
            { headers: { 'x-service-secret': process.env.SERVICE_SECRET } }
          )
          .catch((err) => console.error('[Payment] Failed to update appointment:', err.message));

        console.log(`[Stripe] Payment succeeded for appointment ${payment.appointmentId}`);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
        console.log(`[Stripe] Payment failed for appointment ${payment.appointmentId}`);
      }
    } else if (event.type === 'charge.refunded') {
      const chargeId = intent.id;
      const payment  = await Payment.findOne({ stripeChargeId: chargeId });
      if (payment) {
        payment.status = 'refunded';
        await payment.save();
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err.message);
  }

  res.status(200).json({ received: true });
};

// ── POST /api/payments/confirm-test ──────────────────────────────────────────
/**
 * SANDBOX/TEST ONLY — simulates a successful Stripe payment without the webhook.
 * Use this in Postman to mark a payment as completed and update the appointment.
 * Body: { paymentIntentId }
 */
export const confirmTestPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'paymentIntentId is required' });
    }

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    payment.status             = 'completed';
    payment.stripePaymentMethod = 'visa (test)';
    await payment.save();

    // Update appointment paymentStatus
    const APPT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
    await axios
      .put(
        `${APPT_URL}/api/appointments/${payment.appointmentId}/payment-status`,
        { paymentStatus: 'paid', paymentMethod: 'card' },
        { headers: { 'x-service-secret': process.env.SERVICE_SECRET } }
      )
      .catch((err) => console.error('[Payment] Failed to update appointment:', err.message));

    res.status(200).json({ success: true, message: 'Payment confirmed (test)', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/payments/appointment/:appointmentId ──────────────────────────────
export const getPaymentByAppointment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ appointmentId: req.params.appointmentId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'No payment found for this appointment' });
    }
    const { id, role } = req.user;
    if (role !== 'admin' && payment.patientId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/payments/my ──────────────────────────────────────────────────────
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/payments/doctor/my ───────────────────────────────────────────────
// Returns all completed payments for appointments belonging to this doctor.
// Used by the doctor's appointment pages to cross-verify payment status.
export const getMyPaymentsAsDoctor = async (req, res) => {
  try {
    const payments = await Payment.find({
      doctorId: req.user.id,
      status:   'completed',
    }).select('appointmentId status amount amountLkr currency itemName createdAt').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/payments/:id ─────────────────────────────────────────────────────
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    const { id, role } = req.user;
    if (role !== 'admin' && payment.patientId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/payments/admin/:appointmentId/mark-cash-paid ───────────────────
/**
 * Admin marks a cash appointment's payment as completed.
 * Creates a payment record if one doesn't exist yet.
 */
export const adminMarkCashPaid = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { patientId = 'unknown', doctorId = 'unknown', amount = 0, amountLkr = 0 } = req.body;
    const safeAmountLkr = Number(amountLkr) || 0;
    const amountLkrCents = Math.max(0, Math.round(safeAmountLkr * 100));

    const APPT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';

    // Guard: cancelled appointments cannot be marked as paid.
    let apptStatusRes;
    try {
      apptStatusRes = await axios.get(
        `${APPT_URL}/api/appointments/internal/${appointmentId}/status`,
        { headers: { 'x-service-secret': process.env.SERVICE_SECRET } }
      );
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      return res.status(502).json({ success: false, message: 'Unable to verify appointment status' });
    }
    const appointmentStatus = apptStatusRes.data?.data?.status;
    if (appointmentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot mark a cancelled appointment as paid' });
    }

    // Idempotent — don't double-complete
    const existing = await Payment.findOne({ appointmentId });
    if (existing?.status === 'completed') {
      return res.status(409).json({ success: false, message: 'Payment already completed' });
    }

    let payment;
    if (existing) {
      existing.status              = 'completed';
      existing.stripePaymentMethod = 'cash';
      existing.itemName            = 'Cash Payment';
      existing.currency            = 'lkr';
      existing.amountLkr           = safeAmountLkr;
      existing.amount              = amountLkrCents;
      payment = await existing.save();
    } else {
      payment = await Payment.create({
        appointmentId,
        patientId,
        doctorId,
        stripePaymentIntentId: `cash_${appointmentId}`,
        stripeClientSecret:    'cash_na',
        amount: amountLkrCents,
        amountLkr: safeAmountLkr,
        currency: 'lkr',
        status:   'completed',
        itemName: 'Cash Payment',
        stripePaymentMethod: 'cash',
      });
    }

    // Notify appointment service via internal route
    await axios
      .put(
        `${APPT_URL}/api/appointments/${appointmentId}/payment-status`,
        { paymentStatus: 'paid', paymentMethod: 'cash' },
        { headers: { 'x-service-secret': process.env.SERVICE_SECRET } }
      )
      .catch((err) => console.error('[Payment] Failed to update appointment:', err.message));

    res.status(200).json({ success: true, message: 'Cash payment marked as paid', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/payments/admin/:appointmentId/mark-refunded ───────────────────
/**
 * Admin marks a paid appointment payment as refunded.
 * Intended for cancelled appointments where money should be returned.
 */
export const adminMarkRefunded = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const payment = await Payment.findOne({ appointmentId }).sort({ createdAt: -1 });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this appointment' });
    }

    if (payment.status === 'refunded') {
      return res.status(409).json({ success: false, message: 'Payment is already marked as refunded' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
    }

    payment.status = 'refunded';
    await payment.save();

    // Sync appointment paymentStatus with appointment-service
    const APPT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
    await axios
      .put(
        `${APPT_URL}/api/appointments/${appointmentId}/payment-status`,
        { paymentStatus: 'refunded', paymentMethod: payment.stripePaymentMethod || undefined },
        { headers: { 'x-service-secret': process.env.SERVICE_SECRET } }
      )
      .catch((err) => console.error('[Payment] Failed to update appointment:', err.message));

    res.status(200).json({ success: true, message: 'Payment marked as refunded', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/payments/admin/all ───────────────────────────────────────────────
export const getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
