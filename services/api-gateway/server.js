import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3009';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}:${email}`;
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
    });
  },
});

const PASSWORD_LOGIN_PATHS = new Set([
  '/api/auth/patient/login',
  '/api/auth/doctor/login',
  '/api/auth/admin/login',
]);

const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/patient/register',
  '/api/auth/patient/login',
  '/api/auth/patient/google',
  '/api/auth/doctor/register',
  '/api/auth/doctor/login',
  '/api/auth/doctor/google',
  '/api/auth/admin/login',
  '/api/auth/verify',
]);

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

app.use((req, res, next) => {
  if (req.method === 'POST' && PASSWORD_LOGIN_PATHS.has(req.path)) {
    return loginLimiter(req, res, next);
  }
  next();
});

app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ') || PUBLIC_AUTH_PATHS.has(req.path)) {
    return next();
  }

  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: { Authorization: authHeader },
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      return res.status(401).json({
        success: false,
        message: response.data?.message || 'Invalid or expired token',
      });
    }

    next();
  } catch (err) {
    console.error(`[Gateway] Token verification failed: ${err.message}`);
    res.status(503).json({ success: false, message: 'Authentication service unavailable' });
  }
});

// ── Service URLs ──────────────────────────────────────────────────────────────
const ROUTES = [
  { prefix: '/api/auth',          target: AUTH_SERVICE_URL },
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
