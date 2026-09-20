import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from './models/Doctor.js';

dotenv.config();

const verifyAllDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Doctor.updateMany(
      {},
      { 
        $set: { 
          isVerified: true,
          isActive: true,
          isAvailable: true
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} doctors`);
    console.log('   - isVerified: true');
    console.log('   - isActive: true');
    console.log('   - isAvailable: true');

    const doctors = await Doctor.find().select('firstName lastName email isVerified isActive isAvailable');
    console.log('\nDoctors in database:');
    doctors.forEach(d => {
      console.log(`  - ${d.firstName} ${d.lastName} (${d.email}) - Verified: ${d.isVerified}, Active: ${d.isActive}, Available: ${d.isAvailable}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyAllDoctors();
