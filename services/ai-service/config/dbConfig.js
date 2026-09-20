import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('AI Service: MongoDB connected');
  } catch (error) {
    console.error('AI Service: MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
