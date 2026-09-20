import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    reportType:  {
      type: String,
      enum: ['lab_report', 'prescription', 'scan', 'discharge_summary', 'other'],
      default: 'lab_report',
    },
    fileUrl:   { type: String, required: true },  
    publicId:  { type: String, required: true },  
    fileFormat: { type: String, trim: true, default: null }
  },
  { timestamps: true }
);

reportSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
