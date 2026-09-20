import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Doctor from '../models/Doctor.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Profile (all optional fields filled after registration) ──────────
export const updateProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const {
      firstName, lastName, phone, gender, dateOfBirth,
      specialization, qualifications, description, licenseNumber, hospital, experience, consultationFee, address,
    } = req.body;

    if (firstName)                   doctor.firstName       = firstName;
    if (lastName)                    doctor.lastName        = lastName;
    if (phone !== undefined)         doctor.phone           = phone;
    if (gender !== undefined)        doctor.gender          = gender;
    if (dateOfBirth !== undefined)   doctor.dateOfBirth     = dateOfBirth;
    if (specialization)              doctor.specialization  = specialization;
    if (qualifications !== undefined) doctor.qualifications = qualifications;
    if (description !== undefined)   doctor.description     = description;
    if (licenseNumber !== undefined) doctor.licenseNumber   = licenseNumber;
    if (hospital !== undefined)      doctor.hospital        = hospital;
    if (experience !== undefined)    doctor.experience      = experience;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (address) {
      doctor.address = { ...doctor.address?.toObject?.() ?? {}, ...address };
    }

    const updated = await doctor.save();
    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const doctor = await Doctor.findById(req.user.id).select('+password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    doctor.password = await bcrypt.hash(newPassword, salt);
    await doctor.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload Profile Image 
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    doctor.profileImage = req.file.path; // Cloudinary URL via multer-storage-cloudinary
    await doctor.save();

    res.json({ success: true, message: 'Profile image updated', data: { profileImage: doctor.profileImage } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Deactivate Own Account 
export const deactivateAccount = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    doctor.isActive = false;
    await doctor.save();
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reactivate Account
export const activateAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (doctor.isActive) {
      return res.status(400).json({ success: false, message: 'Account is already active' });
    }

    doctor.isActive = true;
    await doctor.save();

    res.json({
      success: true,
      message: 'Account reactivated successfully',
      data: {
        _id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        token: generateToken(doctor._id, 'doctor'),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Own Account
export const deleteAccount = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    await Doctor.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle own availability (protected)
export const toggleAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();
    res.json({
      success: true,
      message: `You are now marked as ${doctor.isAvailable ? 'available' : 'unavailable'}`,
      data: { isAvailable: doctor.isAvailable },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available verified doctors (public — for patient browsing)
export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isAvailable: true, isActive: true, isVerified: true }).select(
      'firstName lastName specialization qualifications experience consultationFee profileImage isAvailable isVerified'
    );
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal — called by admin-service (service-to-service)
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-password');
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal — toggle isVerified (called by admin-service)
export const verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    doctor.isVerified = req.body.isVerified !== undefined ? req.body.isVerified : !doctor.isVerified;
    await doctor.save();
    res.json({
      success: true,
      message: `Doctor ${doctor.isVerified ? 'verified' : 'unverified'} successfully`,
      data: { _id: doctor._id, firstName: doctor.firstName, lastName: doctor.lastName, isVerified: doctor.isVerified },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single doctor by ID (public) 
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password');
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
