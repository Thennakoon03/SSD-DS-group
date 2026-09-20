import mongoose from 'mongoose';

// Create connections immediately at module load — models bind to these objects.
// URIs are supplied lazily inside connectAll() after dotenv has run.
export const patientConn = mongoose.createConnection();
export const doctorConn  = mongoose.createConnection();
export const adminConn   = mongoose.createConnection();

export const connectAll = () => {
  const opts = { serverSelectionTimeoutMS: 10000 };

  return Promise.all([
    patientConn.openUri(process.env.PATIENT_DB_URI, opts),
    doctorConn.openUri(process.env.DOCTOR_DB_URI,  opts),
    adminConn.openUri(process.env.ADMIN_DB_URI,    opts),
  ])
    .then(() => console.log('Auth Service: All DB connections established'))
    .catch((err) => {
      console.error('Auth Service: DB connection failed:', err.message);
      process.exit(1);
    });
};
