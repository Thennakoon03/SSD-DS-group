import axios from 'axios';
import Admin from '../models/Admin.js';

// GET /api/admin/users/patients
export const getAllPatients = async (req, res) => {
  try {
    const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
    const SERVICE_KEY = process.env.SERVICE_SECRET_KEY;
    const response = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/admin/all`, {
      headers: { 'x-service-key': SERVICE_KEY },
    });
    res.json(response.data);
  } catch (error) {
    const status  = error.response?.status  || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ success: false, message });
  }
};

// GET /api/admin/users/doctors
export const getAllDoctors = async (req, res) => {
  try {
    const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
    const SERVICE_KEY = process.env.SERVICE_SECRET_KEY;
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/admin/all`, {
      headers: { 'x-service-key': SERVICE_KEY },
    });
    res.json(response.data);
  } catch (error) {
    const status  = error.response?.status  || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ success: false, message });
  }
};

// GET /api/admin/users/admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/users/doctors/:id/verify
export const verifyDoctor = async (req, res) => {
  try {
    const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
    const SERVICE_KEY = process.env.SERVICE_SECRET_KEY;
    const response = await axios.put(
      `${DOCTOR_SERVICE_URL}/api/doctors/admin/${req.params.id}/verify`,
      req.body,
      { headers: { 'x-service-key': SERVICE_KEY } }
    );
    res.json(response.data);
  } catch (error) {
    const status  = error.response?.status  || 500;
    const message = error.response?.data?.message || error.message;
    res.status(status).json({ success: false, message });
  }
};

// DELETE /api/admin/users/admins/:id
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await Admin.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
