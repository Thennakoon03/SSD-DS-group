import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Admin Service: MongoDB connected');
  } catch (error) {
    console.error('Admin Service: MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
