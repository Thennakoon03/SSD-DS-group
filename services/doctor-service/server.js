import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import doctorRoutes from './routes/doctorRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/doctors', doctorRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Doctor Service is running' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Doctor Service running on port ${PORT}`);
  });
});
