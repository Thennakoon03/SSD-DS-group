import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectAll } from './config/dbConfig.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3009;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (_req, res) => res.json({ message: 'Auth Service is running' }));

// Wait for all three DB connections before accepting traffic
connectAll().then(() => {
  app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
});
