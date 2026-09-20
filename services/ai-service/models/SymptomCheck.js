import mongoose from 'mongoose';

const ConditionSchema = new mongoose.Schema({
  name:        { type: String },
  likelihood:  { type: String }, // high / moderate / low
  description: { type: String },
}, { _id: false });

const SymptomCheckSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },

    // Input
    symptoms: { type: String, required: true },
    age:      { type: Number },
    gender:   { type: String },

    // AI output
    symptomsAnalyzed:       [{ type: String }],
    possibleConditions:     [ConditionSchema],
    recommendedSpecialties: [{ type: String }],
    urgencyLevel:           {
      type: String,
      enum: ['routine', 'soon', 'urgent', 'emergency'],
      default: 'routine',
    },
    generalAdvice: { type: String },
    disclaimer:    { type: String },
  },
  { timestamps: true },
);

export default mongoose.model('SymptomCheck', SymptomCheckSchema);
