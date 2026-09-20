import { v4 as uuidv4 } from 'uuid';
import agoraToken from 'agora-token';
import axios from 'axios';
import Session from '../models/Session.js';

const { RtcTokenBuilder, RtcRole } = agoraToken;

// ── Notification helper ────────────────────────────────────────────────────
const notifyAsync = (endpoint, payload) => {
  const NOTIF_URL = `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'}/api/notifications`;
  axios
    .post(`${NOTIF_URL}/${endpoint}`, payload, {
      headers: { 'x-service-secret': process.env.SERVICE_SECRET },
    })
    .catch((err) =>
      console.error(`[Notification] Failed to call ${endpoint}:`, err.message)
    );
};

const toAgoraUid = (mongoId) => {
  const hex = String(mongoId).slice(-8);
  return parseInt(hex, 16) >>> 0; // unsigned 32-bit
};

export const createSession = async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId, scheduledAt, notes } = req.body;

    if (!appointmentId || !patientId || !doctorId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, patientId, doctorId, and scheduledAt are required',
      });
    }

    // Ensure the requester is one of the participants
    const requesterId = req.user.id;
    if (requesterId !== patientId && requesterId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Only the patient or doctor of this appointment can create a session',
      });
    }

    // Prevent duplicate sessions for the same appointment
    const existing = await Session.findOne({ appointmentId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A telemedicine session already exists for this appointment',
        data: existing,
      });
    }

    // Generate a unique Agora channel name
    const channelName = `session_${uuidv4().replace(/-/g, '')}`;

    const session = await Session.create({
      appointmentId,
      patientId,
      doctorId,
      channelName,
      scheduledAt: new Date(scheduledAt),
      notes: notes || null,
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    // Race condition: two clients hit createSession simultaneously — return existing as 409
    if (error.code === 11000) {
      try {
        const existing = await Session.findOne({ appointmentId: req.body.appointmentId });
        return res.status(409).json({
          success: false,
          message: 'A telemedicine session already exists for this appointment',
          data: existing,
        });
      } catch (fetchErr) {
        return res.status(500).json({ success: false, message: fetchErr.message });
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getUserSessions = async (req, res) => {
  try {
    const { id, role } = req.user;
    let query = {};

    if (role === 'patient') {
      query = { patientId: id };
    } else if (role === 'doctor') {
      query = { doctorId: id };
    }
    // admin → no filter, get all

    const sessions = await Session.find(query).sort({ scheduledAt: -1 });
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/telemedicine/sessions/:sessionId ──────────────────────────────

/**
 * Get a single session by its MongoDB _id.
 */
export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Only participants or admin may view
    const { id, role } = req.user;
    if (
      role !== 'admin' &&
      session.patientId !== id &&
      session.doctorId !== id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/telemedicine/sessions/appointment/:appointmentId ──────────────

/**
 * Get a session by its associated appointmentId.
 */
export const getSessionByAppointment = async (req, res) => {
  try {
    const session = await Session.findOne({ appointmentId: req.params.appointmentId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'No session found for this appointment' });
    }

    const { id, role } = req.user;
    if (
      role !== 'admin' &&
      session.patientId !== id &&
      session.doctorId !== id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateToken = async (req, res) => {
  try {
    const appId          = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({
        success: false,
        message: 'AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set in environment variables',
      });
    }

    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Only the doctor and patient of this session can obtain a token
    const { id, role } = req.user;
    if (role !== 'admin' && session.patientId !== id && session.doctorId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (session.status === 'ended' || session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot join a session that is ${session.status}`,
      });
    }

    // Token valid for 2 hours
    const TOKEN_TTL_SECONDS    = 2 * 60 * 60;
    const PRIVILEGE_TTL_SECONDS = 2 * 60 * 60;

    const nowSeconds  = Math.floor(Date.now() / 1000);
    const tokenExpiry = nowSeconds + TOKEN_TTL_SECONDS;

    const uid    = toAgoraUid(id);
    const aRole  = role === 'doctor' ? RtcRole.PUBLISHER : RtcRole.PUBLISHER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      session.channelName,
      uid,
      aRole,
      TOKEN_TTL_SECONDS,
      PRIVILEGE_TTL_SECONDS
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        channelName: session.channelName,
        uid,
        appId,
        expiresAt: new Date(tokenExpiry * 1000).toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const { id, role } = req.user;
    if (role !== 'admin' && session.patientId !== id && session.doctorId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (session.status === 'ended' || session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot join a session that is ${session.status}`,
      });
    }

    if (session.status !== 'active') {
      session.status    = 'active';
      session.startedAt = session.startedAt || new Date();
      await session.save();
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const { id, role } = req.user;
    if (role !== 'admin' && session.patientId !== id && session.doctorId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (session.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Session is already ended' });
    }

    const now = new Date();
    session.status  = 'ended';
    session.endedAt = now;

    if (session.startedAt) {
      const ms = now - new Date(session.startedAt);
      session.durationMinutes = Math.round(ms / 60000);
    }

    if (req.body?.notes) session.notes = req.body.notes;

    await session.save();

    // Fire-and-forget consultation-completed notification
    notifyAsync('consultation-completed', {
      patient: { id: session.patientId, name: 'Patient', email: null, phone: null },
      doctor:  { id: session.doctorId,  name: 'Doctor',  email: null, phone: null },
      session: {
        _id:             session._id,
        durationMinutes: session.durationMinutes,
      },
    });

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const { id, role } = req.user;
    if (role !== 'admin' && session.patientId !== id && session.doctorId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (session.status === 'active' || session.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a session that is already ${session.status}`,
      });
    }

    session.status = 'cancelled';
    await session.save();

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
