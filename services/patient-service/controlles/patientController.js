import bcrypt from 'bcryptjs';
import Patient from '../models/Patient.js';
import Report from '../models/Report.js';
import { v2 as cloudinary } from 'cloudinary';

//Get Profile
export const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    if (!patient.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Update Profile (all optional fields)
export const updateProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const {
      firstName, lastName, nic, phone, dateOfBirth, gender,
      bloodGroup, address, allergies, chronicDiseases,
      currentMedications, emergencyContact,
    } = req.body;

    if (firstName)          patient.firstName          = firstName;
    if (lastName)           patient.lastName           = lastName;
    if (nic !== undefined)  patient.nic                = nic;
    if (phone !== undefined)       patient.phone       = phone;
    if (dateOfBirth !== undefined)  patient.dateOfBirth = dateOfBirth;
    if (gender !== undefined)       patient.gender      = gender;
    if (bloodGroup !== undefined)   patient.bloodGroup  = bloodGroup;

    if (address) {
      patient.address = { ...patient.address?.toObject?.() ?? {}, ...address };
    }
    if (allergies)          patient.allergies          = allergies;
    if (chronicDiseases)    patient.chronicDiseases    = chronicDiseases;
    if (currentMedications) patient.currentMedications = currentMedications;
    if (emergencyContact) {
      patient.emergencyContact = { ...patient.emergencyContact?.toObject?.() ?? {}, ...emergencyContact };
    }

    const updated = await patient.save();
    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const patient = await Patient.findById(req.user.id).select('+password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, patient.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    patient.password = await bcrypt.hash(newPassword, salt);
    await patient.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Upload / Update Profile Image
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // req.file.path is the Cloudinary URL set by multer-storage-cloudinary
    patient.profileImage = req.file.path;
    await patient.save();

    res.json({ success: true, message: 'Profile image updated', data: { profileImage: patient.profileImage } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Deactivate Own Account
export const deactivateAccount = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    patient.isActive = false;
    await patient.save();
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Own Account ─────────────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    // Delete all Cloudinary report files before removing account
    const reports = await Report.find({ patient: req.user.id });
    await Promise.allSettled(
      reports.map(r => r.publicId ? cloudinary.uploader.destroy(r.publicId) : Promise.resolve())
    );
    await Report.deleteMany({ patient: req.user.id });
    await Patient.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal — called by admin-service (service-to-service)
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().select('-password');
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal — called by appointment-service (service-to-service) to get patient basic info
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select(
      'firstName lastName email phone profileImage gender dateOfBirth bloodGroup allergies chronicDiseases emergencyContact'
    );
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Calculate age from dateOfBirth
    let age = null;
    if (patient.dateOfBirth) {
      const diff = Date.now() - new Date(patient.dateOfBirth).getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    res.json({
      success: true,
      data: {
        _id:              patient._id,
        name:             `${patient.firstName} ${patient.lastName}`,
        firstName:        patient.firstName,
        lastName:         patient.lastName,
        email:            patient.email,
        phone:            patient.phone,
        profileImage:     patient.profileImage,
        gender:           patient.gender,
        dateOfBirth:      patient.dateOfBirth,
        age,
        bloodGroup:       patient.bloodGroup,
        allergies:        patient.allergies,
        chronicDiseases:  patient.chronicDiseases,
        emergencyContact: patient.emergencyContact,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
