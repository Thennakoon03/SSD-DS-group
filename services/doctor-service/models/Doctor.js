import mongoose from "mongoose";

const SPECIALIZATIONS = [
  "Cardiologist", "Dermatologist", "Endocrinologist", "Gastroenterologist",
  "Hematologist", "Infectious Disease Specialist", "Nephrologist", "Neurologist",
  "Obstetrician/Gynecologist", "Oncologist", "Ophthalmologist", "Orthopedic Surgeon",
  "Otolaryngologist", "Pediatrician", "Psychiatrist", "Pulmonologist",
  "Radiologist", "Rheumatologist", "Surgeon", "Urologist",
  "General Practitioner", "Emergency Medicine",
];

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

const doctorSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true, minlength: 8, select: false },
        role: { type: String, enum: ["doctor"], default: "doctor" },
        phone: { type: String, trim: true, default: null },
        gender: { type: String, enum: ["Male", "Female", "Other"], default: null },
        dateOfBirth: { type: Date, default: null },
        specialization: [{ type: String, enum: SPECIALIZATIONS, trim: true }],
        qualifications: { type: String, trim: true, default: null },
        description: { type: String, trim: true, default: null },
        licenseNumber: { type: String, trim: true, default: null },
        hospital: { type: String, trim: true, default: null },
        experience: { type: Number, default: 0 },
        consultationFee: { type: Number, default: 0 },
        address: addressSchema,
        profileImage: { type: String, default: null },
        isAvailable: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
        registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);