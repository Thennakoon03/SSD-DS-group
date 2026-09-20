import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Telemedicine Service: MongoDB connected');
  } catch (error) {
    console.error('Telemedicine Service: MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
