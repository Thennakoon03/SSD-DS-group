import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import Patient from '../models/Patient.js';
import Doctor  from '../models/Doctor.js';
import Admin   from '../models/Admin.js';

// ── helpers ───────────────────────────────────────────────────────────────────
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const MODEL = { patient: Patient, doctor: Doctor, admin: Admin };
const googleClient = new OAuth2Client();

const verifyGoogleIdToken = async (idToken) => {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    throw new Error('Google account email is not verified');
  }

  return payload;
};

const randomPasswordHash = async () =>
  bcrypt.hash(`google_${Date.now()}_${Math.random()}`, await bcrypt.genSalt(10));

const buildAuthResponse = (role, userDoc) => {
  if (role === 'patient') {
    return {
      _id:          userDoc._id,
      firstName:    userDoc.firstName,
      lastName:     userDoc.lastName,
      email:        userDoc.email,
      profileImage: userDoc.profileImage,
      role:         'patient',
      token:        generateToken(userDoc._id, 'patient'),
    };
  }

  return {
    _id:          userDoc._id,
    firstName:    userDoc.firstName,
    lastName:     userDoc.lastName,
    email:        userDoc.email,
    profileImage: userDoc.profileImage,
    isVerified:   userDoc.isVerified,
    role:         'doctor',
    token:        generateToken(userDoc._id, 'doctor'),
  };
};

// ── REGISTER ─────────────────────────────────────────────────────────────────
export const registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'firstName, lastName, email, and password are required' });
    }

    if (await Patient.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashed  = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const patient = await Patient.create({ firstName, lastName, email, password: hashed });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        _id:       patient._id,
        firstName: patient.firstName,
        lastName:  patient.lastName,
        email:     patient.email,
        role:      'patient',
        token:     generateToken(patient._id, 'patient'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const registerDoctor = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'firstName, lastName, email, and password are required' });
    }

    if (await Doctor.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const doctor = await Doctor.create({ firstName, lastName, email, password: hashed });

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      data: {
        _id:        doctor._id,
        firstName:  doctor.firstName,
        lastName:   doctor.lastName,
        email:      doctor.email,
        role:       'doctor',
        isVerified: doctor.isVerified,
        token:      generateToken(doctor._id, 'doctor'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, and password are required' });
    }

    if (await Admin.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const admin  = await Admin.create({ name, email, password: hashed, role: 'admin' });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        _id:   admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
        token: generateToken(admin._id, 'admin'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email }).select('+password');
    if (!patient) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!patient.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }
    if (!(await bcrypt.compare(password, patient.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id:          patient._id,
        firstName:    patient.firstName,
        lastName:     patient.lastName,
        email:        patient.email,
        profileImage: patient.profileImage,
        role:         'patient',
        token:        generateToken(patient._id, 'patient'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!doctor.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }
    if (!(await bcrypt.compare(password, doctor.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id:          doctor._id,
        firstName:    doctor.firstName,
        lastName:     doctor.lastName,
        email:        doctor.email,
        profileImage: doctor.profileImage,
        isVerified:   doctor.isVerified,
        role:         'doctor',
        token:        generateToken(doctor._id, 'doctor'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GOOGLE AUTH (patient/doctor) ───────────────────────────────────────────
const googleAuthByRole = (role) => async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    const payload = await verifyGoogleIdToken(idToken);
    const email = String(payload.email).toLowerCase();
    const firstName = payload.given_name || 'Google';
    const lastName = payload.family_name || 'User';

    const targetModel = MODEL[role];
    const otherModels = Object.entries(MODEL)
      .filter(([key]) => key !== role)
      .map(([, model]) => model);

    for (const model of otherModels) {
      const existing = await model.findOne({ email });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'This Google email is already registered with a different account role.',
        });
      }
    }

    let user = await targetModel.findOne({ email }).select('+password');

    if (!user) {
      const base = {
        firstName,
        lastName,
        email,
        password: await randomPasswordHash(),
      };

      user = await targetModel.create(base);
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: buildAuthResponse(role, user),
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message || 'Google authentication failed' });
  }
};

export const googleAuthPatient = googleAuthByRole('patient');
export const googleAuthDoctor  = googleAuthByRole('doctor');

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }
    if (!(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id:      admin._id,
        name:     admin.name,
        email:    admin.email,
        role:     admin.role,
        isActive: admin.isActive,
        token:    generateToken(admin._id, 'admin'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side by discarding the token.
// This endpoint exists as a clean hook (e.g. for future token blacklisting).
export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ── TOKEN VERIFY (used by API gateway / other services) ───────────────────────
export const verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    res.json({ success: true, data: decoded });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
