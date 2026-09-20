import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://healthcare-project-six.vercel.app',
  credentials: true,
}));

// Raw body support for the Stripe webhook that proxies through here
app.use((req, res, next) => {
  if (req.path.includes('/payments/webhook')) {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// ── Service URLs ──────────────────────────────────────────────────────────────
const ROUTES = [
  { prefix: '/api/auth',          target: process.env.AUTH_SERVICE_URL         || 'http://localhost:3009' },
  { prefix: '/api/patients',      target: process.env.PATIENT_SERVICE_URL      || 'http://localhost:3001' },
  { prefix: '/api/reports',       target: process.env.PATIENT_SERVICE_URL      || 'http://localhost:3001' },
  { prefix: '/api/doctors',       target: process.env.DOCTOR_SERVICE_URL       || 'http://localhost:3002' },
  { prefix: '/api/admin',         target: process.env.ADMIN_SERVICE_URL        || 'http://localhost:3003' },
  { prefix: '/api/appointments',  target: process.env.APPOINTMENT_SERVICE_URL  || 'http://localhost:3004' },
  { prefix: '/api/notifications', target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005' },
  { prefix: '/api/telemedicine',  target: process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3006' },
  { prefix: '/api/ai',            target: process.env.AI_SERVICE_URL           || 'http://localhost:3007' },
  { prefix: '/api/payments',      target: process.env.PAYMENT_SERVICE_URL      || 'http://localhost:3008' },
];

// ── Generic proxy handler ─────────────────────────────────────────────────────
const forwardRequest = (target) => async (req, res) => {
  try {
    const url = `${target}${req.originalUrl}`;

    const headers = { ...req.headers, host: new URL(target).host };
    delete headers['content-length']; // let axios recalculate

    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');

    const response = await axios({
      method:       req.method,
      url,
      headers,
      data:         isMultipart ? req : req.body,
      params:       req.query,
      responseType: 'arraybuffer',
      maxBodyLength:    Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true, // forward all status codes
    });

    res.status(response.status);
    Object.entries(response.headers).forEach(([k, v]) => {
      if (!['transfer-encoding', 'connection'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });
    res.send(response.data);
  } catch (err) {
    console.error(`[Gateway] Error forwarding to ${target}: ${err.message}`);
    res.status(502).json({ success: false, message: 'Service unavailable' });
  }
};

// ── Register routes ───────────────────────────────────────────────────────────
ROUTES.forEach(({ prefix, target }) => {
  app.all(`${prefix}/{*path}`, forwardRequest(target));
  app.all(prefix,              forwardRequest(target));
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway is running',
    routes: ROUTES.map(({ prefix, target }) => ({ prefix, target })),
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});