import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/dbConfig.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { stripeWebhook } from './controllers/paymentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
connectDB();

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());

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
