import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import startCronJobs from './scripts/cronJobs.js';

dotenv.config();
connectDB();

startCronJobs();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.use('/api/appointments', appointmentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Appointment Service is running' });
});

app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});
