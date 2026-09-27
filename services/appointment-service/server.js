import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import googleCalendarRoutes from './routes/googleCalendarRoutes.js';
import startCronJobs from './scripts/cronJobs.js';

dotenv.config();
connectDB();

startCronJobs();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// More specific path mounted first so it is never shadowed by appointmentRoutes' /:id
app.use('/api/appointments/integrations/google-calendar', googleCalendarRoutes);
app.use('/api/appointments', appointmentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Appointment Service is running' });
});

app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});
