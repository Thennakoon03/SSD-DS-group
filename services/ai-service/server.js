import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import symptomRoutes from './routes/symptomRoutes.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/ai', symptomRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AI Service is running', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});
