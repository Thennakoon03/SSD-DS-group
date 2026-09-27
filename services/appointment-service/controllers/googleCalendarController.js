import { randomBytes, createHash } from 'node:crypto';
import axios from 'axios';
import GoogleCalendarConnection from '../models/GoogleCalendarConnection.js';
import { encryptToken, decryptToken } from '../utils/tokenEncryption.js';

const GOOGLE_AUTH_ENDPOINT  = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_EVENTS_URL   = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const CALENDAR_SCOPE        = 'https://www.googleapis.com/auth/calendar.events';

// Pending authorization requests: state -> { userId, role, codeVerifier, createdAt }.
// Short-lived (5 min) and only needed between /connect and /callback, so an
// in-memory store is sufficient for this single-instance deployment.
// A multi-instance deployment should back this with Redis or a TTL-indexed
// Mongo collection instead.
const pendingAuth = new Map();
const PENDING_TTL_MS = 5 * 60 * 1000;

const cleanupExpiredPending = () => {
  const now = Date.now();
  for (const [state, entry] of pendingAuth) {
    if (now - entry.createdAt > PENDING_TTL_MS) pendingAuth.delete(state);
  }
};

const base64url = (buffer) =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// ── GET /connect — start the Authorization Code + PKCE flow ────────────────
export const getGoogleAuthUrl = async (req, res) => {
  try {
    cleanupExpiredPending();

    const clientId    = process.env.GOOGLE_CLIENT_ID;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return res.status(500).json({ success: false, message: 'Google Calendar integration is not configured' });
    }

    const state        = base64url(randomBytes(24));
    const codeVerifier  = base64url(randomBytes(32));
    const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest());

    pendingAuth.set(state, {
      userId:  req.user.id,
      role:    req.user.role,
      codeVerifier,
      createdAt: Date.now(),
    });

    const params = new URLSearchParams({
      client_id:             clientId,
      redirect_uri:          redirectUri,
      response_type:         'code',
      scope:                 CALENDAR_SCOPE,
      access_type:           'offline',
      prompt:                'consent',
      state,
      code_challenge:        codeChallenge,
      code_challenge_method: 'S256',
    });

    res.json({ success: true, data: { authUrl: `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}` } });
  } catch {
    res.status(500).json({ success: false, message: 'Could not start Google Calendar authorization' });
  }
};

// ── POST /callback — exchange the authorization code for tokens ───────────
export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) {
      return res.status(400).json({ success: false, message: 'code and state are required' });
    }

    const pending = pendingAuth.get(state);
    // state must exist, be unused, unexpired, and belong to this authenticated caller —
    // this is what prevents CSRF / authorization-code-injection against another user.
    if (!pending || pending.userId !== req.user.id || Date.now() - pending.createdAt > PENDING_TTL_MS) {
      return res.status(400).json({ success: false, message: 'Invalid or expired authorization state' });
    }
    pendingAuth.delete(state); // one-time use

    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri   = process.env.GOOGLE_REDIRECT_URI;

    const tokenRes = await axios.post(
      GOOGLE_TOKEN_ENDPOINT,
      new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
        code_verifier: pending.codeVerifier,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, validateStatus: () => true }
    );

    if (tokenRes.status !== 200 || !tokenRes.data?.access_token) {
      return res.status(502).json({ success: false, message: 'Google rejected the authorization code' });
    }

    const { access_token, refresh_token, expires_in, scope } = tokenRes.data;
    if (!refresh_token) {
      // Happens if the user had already granted consent before without prompt=consent.
      // Fail closed rather than storing a connection we can't refresh long-term.
      return res.status(409).json({
        success: false,
        message: 'Google did not return a refresh token. Revoke access at myaccount.google.com/permissions and try connecting again.',
      });
    }

    await GoogleCalendarConnection.findOneAndUpdate(
      { userId: pending.userId, role: pending.role },
      {
        userId: pending.userId,
        role:   pending.role,
        accessToken:  encryptToken(access_token),
        refreshToken: encryptToken(refresh_token),
        accessTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        scope: scope || CALENDAR_SCOPE,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Google Calendar connected successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to complete Google Calendar authorization' });
  }
};

// ── GET /status ─────────────────────────────────────────────────────────────
export const getConnectionStatus = async (req, res) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({
      userId: req.user.id,
      role:   req.user.role,
    }).select('createdAt updatedAt scope');

    res.json({ success: true, data: { connected: !!connection, connectedAt: connection?.createdAt || null } });
  } catch {
    res.status(500).json({ success: false, message: 'Could not read Google Calendar connection status' });
  }
};

// ── DELETE /disconnect ──────────────────────────────────────────────────────
export const disconnectGoogleCalendar = async (req, res) => {
  try {
    await GoogleCalendarConnection.deleteOne({ userId: req.user.id, role: req.user.role });
    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch {
    res.status(500).json({ success: false, message: 'Could not disconnect Google Calendar' });
  }
};

// ── Internal helpers used by appointmentController ──────────────────────────

// Returns a valid (refreshed if needed) access token for a user, or null if not connected.
const getValidAccessToken = async (userId, role) => {
  const connection = await GoogleCalendarConnection.findOne({ userId, role });
  if (!connection) return null;

  if (connection.accessTokenExpiresAt > new Date(Date.now() + 60_000)) {
    return decryptToken(connection.accessToken);
  }

  // Access token expired (or about to) — use the refresh token grant to get a new one.
  const refreshToken = decryptToken(connection.refreshToken);
  const tokenRes = await axios.post(
    GOOGLE_TOKEN_ENDPOINT,
    new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, validateStatus: () => true }
  );

  if (tokenRes.status !== 200 || !tokenRes.data?.access_token) {
    // Refresh token was revoked/expired — drop the stale connection so status reflects reality.
    await GoogleCalendarConnection.deleteOne({ _id: connection._id });
    return null;
  }

  connection.accessToken = encryptToken(tokenRes.data.access_token);
  connection.accessTokenExpiresAt = new Date(Date.now() + tokenRes.data.expires_in * 1000);
  await connection.save();

  return tokenRes.data.access_token;
};

// Appointment.appointmentDate holds only the calendar day (parsed from a
// date-only "YYYY-MM-DD" string, so it's anchored at UTC midnight for that
// day). The actual clinic-local wall-clock time lives separately in
// appointment.appointmentTime as "HH:mm" (24-hour). Combine both instead of
// using appointmentDate alone, which would always land on midnight.
const CLINIC_UTC_OFFSET = '+05:30'; // Asia/Colombo — no DST, so a fixed offset is safe

const getAppointmentStart = (appointment) => {
  const day  = new Date(appointment.appointmentDate);
  const y    = day.getUTCFullYear();
  const m    = String(day.getUTCMonth() + 1).padStart(2, '0');
  const d    = String(day.getUTCDate()).padStart(2, '0');
  const time = /^\d{2}:\d{2}$/.test(appointment.appointmentTime) ? appointment.appointmentTime : '09:00';
  return new Date(`${y}-${m}-${d}T${time}:00${CLINIC_UTC_OFFSET}`);
};

// Creates (or updates) a Calendar event for one participant of an appointment.
// Fire-and-forget from appointmentController — never throws, only logs.
const upsertEventForParticipant = async (userId, role, appointment) => {
  try {
    const accessToken = await getValidAccessToken(userId, role);
    if (!accessToken) return; // not connected — nothing to do

    const start = getAppointmentStart(appointment);
    const end   = new Date(start.getTime() + (appointment.duration || 30) * 60000);

    const eventBody = {
      summary:     `MediConnect Appointment (${appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-person'})`,
      description: appointment.reason || 'Healthcare appointment',
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Colombo' },
      end:   { dateTime: end.toISOString(), timeZone: 'Asia/Colombo' },
      extendedProperties: { private: { mediconnectAppointmentId: String(appointment._id) } },
    };

    // Look for an event already synced for this appointment so a repeat call
    // (e.g. status re-saved as confirmed) updates it instead of creating a duplicate.
    const search = await axios.get(CALENDAR_EVENTS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { privateExtendedProperty: `mediconnectAppointmentId=${appointment._id}` },
      validateStatus: () => true,
    });
    const existing = search.data?.items?.[0];

    if (existing) {
      await axios.patch(`${CALENDAR_EVENTS_URL}/${existing.id}`, eventBody, {
        headers: { Authorization: `Bearer ${accessToken}` },
        validateStatus: () => true,
      });
    } else {
      await axios.post(CALENDAR_EVENTS_URL, eventBody, {
        headers: { Authorization: `Bearer ${accessToken}` },
        validateStatus: () => true,
      });
    }
  } catch (err) {
    console.error(`[GoogleCalendar] Failed to sync event for ${role} ${userId}:`, err.message);
  }
};

// Deletes any Calendar event matching this appointment for one participant.
const deleteEventForParticipant = async (userId, role, appointment) => {
  try {
    const accessToken = await getValidAccessToken(userId, role);
    if (!accessToken) return;

    const search = await axios.get(CALENDAR_EVENTS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { privateExtendedProperty: `mediconnectAppointmentId=${appointment._id}` },
      validateStatus: () => true,
    });

    const events = search.data?.items || [];
    await Promise.all(
      events.map((event) =>
        axios.delete(`${CALENDAR_EVENTS_URL}/${event.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          validateStatus: () => true,
        })
      )
    );
  } catch (err) {
    console.error(`[GoogleCalendar] Failed to remove event for ${role} ${userId}:`, err.message);
  }
};

// Called when an appointment is confirmed — syncs to both participants' calendars.
export const syncAppointmentToCalendar = (appointment) => {
  upsertEventForParticipant(appointment.patientId, 'patient', appointment);
  upsertEventForParticipant(appointment.doctorId,  'doctor',  appointment);
};

// Called when an appointment is cancelled — removes it from both calendars.
export const removeAppointmentFromCalendar = (appointment) => {
  deleteEventForParticipant(appointment.patientId, 'patient', appointment);
  deleteEventForParticipant(appointment.doctorId,  'doctor',  appointment);
};
