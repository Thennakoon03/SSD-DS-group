import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Admin Service is running' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Admin Service running on port ${PORT}`);
  });
});
