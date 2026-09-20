import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import telemedicineRoutes from './routes/telemedicineRoutes.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.use('/api/telemedicine', telemedicineRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Telemedicine Service is running' });
});

app.listen(PORT, () => {
  console.log(`Telemedicine Service running on port ${PORT}`);
});
