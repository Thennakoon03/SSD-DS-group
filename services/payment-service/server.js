import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/dbConfig.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { stripeWebhook } from './controllers/paymentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
connectDB();

const app = express();
const PORT = process.env.PORT || 3008;

// 1. Disable Express technology fingerprinting
app.disable('x-powered-by');

// 2. Set defensive security headers (X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet());

// 3. Restrict CORS to explicit whitelisted origins instead of wildcard '*'
const allowedOrigins = [
  'http://localhost:5173', // React/Vite frontend
  'http://localhost:3000'  // API Gateway
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Stripe webhook, server-to-server microservice calls, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS Error: Unauthorized origin blocked'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ── Stripe webhook MUST use raw body — mount BEFORE express.json() ────────────
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

app.use(express.json());

app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Payment Service is running' });
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});