import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: "Sri Lanka" },
    zipCode: { type: String, trim: true },
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const currentMedicationsSchema = new mongoose.Schema(
    {
    medicationName: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    prescribingDoctor: { type: String, trim: true },
    },
    { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    firstName: {type: String, required: true, trim: true},
    lastName: {type: String, required: true, trim: true},
    nic: {type: String, unique: true, sparse: true, trim: true},
    dateOfBirth: {type: Date, default: null},
    gender: {type: String, enum: ["Male", "Female", "Other"], default: null},
    bloodGroup: {type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], default: null},
    phone: {type: String, trim: true, default: null},
    email: {type: String, required: true, unique: true, trim: true, lowercase: true},
    password: {type: String, required: true, minlength: 8, select: false},
    address: addressSchema,
    role: { type: String, enum: ['patient'], default: 'patient' },
    allergies: [{ type: String }],
    chronicDiseases: [{ type: String }],
    currentMedications: [currentMedicationsSchema],
    emergencyContact: emergencyContactSchema,
    profileImage: {type: String, default: null},
    isActive: {type: Boolean, default: true},
    registeredBy: {type: mongoose.Schema.Types.ObjectId,ref: "User"}
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Patient", patientSchema);