import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { telemedicineAPI, appointmentAPI } from '../../utils/api';
import { useAuth } from '../../Context/AuthContext';
import { FiChevronLeft, FiUser, FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';
import { MdCallEnd } from 'react-icons/md';

// ── Agora log level: 0=debug 1=info 2=warn 3=error 4=none ────────────────────
AgoraRTC.setLogLevel(3);

// ── Helpers ───────────────────────────────────────────────────────────────────
const SESSION_STATUS = {
  scheduled: { label: 'Scheduled', dot: 'bg-blue-400',  text: 'text-blue-400' },
  active:    { label: 'Live',      dot: 'bg-green-400', text: 'text-green-400' },
  ended:     { label: 'Ended',     dot: 'bg-gray-400',  text: 'text-gray-400' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',   text: 'text-red-400' },
};

// ── Icon control button ───────────────────────────────────────────────────────
const ControlBtn = ({ onClick, active, ActiveIcon, OffIcon, activeClass, offClass, title }) => {
  const Icon = active ? ActiveIcon : OffIcon;
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-11 h-11 rounded-full flex items-center justify-center transition active:scale-90 ${
        active ? activeClass : offClass
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const DoctorTelemedicineRoom = () => {
  const { appointmentId } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [appointment, setAppointment] = useState(null);
  const [session,     setSession]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // ── RTC state ──────────────────────────────────────────────────────────────
  const [inChannel,   setInChannel]   = useState(false);
  const [joining,     setJoining]     = useState(false);
  const [ending,      setEnding]      = useState(false);
  const [actionErr,   setActionErr]   = useState('');
  const [micOn,       setMicOn]       = useState(true);
  const [camOn,       setCamOn]       = useState(true);
  const [remoteUsers, setRemoteUsers] = useState([]);

  // ── Agora refs ──────────────────────────────────────────────────────────────
  const clientRef        = useRef(null);
  const localAudioRef    = useRef(null);
  const localVideoRef    = useRef(null);
  const localPlayerRef   = useRef(null);
  const remotePlayersRef = useRef({});

  // ── Timer ──────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (session?.status === 'active' && session?.startedAt && inChannel) {
      const start = new Date(session.startedAt).getTime();
      const tick  = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [session?.status, session?.startedAt, inChannel]);

  const fmtElapsed = (s) => {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Init appointment + session ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: apptRes } = await appointmentAPI.getById(appointmentId);
        const appt = apptRes.data;
        setAppointment(appt);

        let sess;
        try {
          const { data: sessRes } = await telemedicineAPI.getByAppointment(appointmentId);
          sess = sessRes.data;
        } catch (e) {
          if (e.response?.status === 404) {
            try {
              const { data: createRes } = await telemedicineAPI.createSession({
                appointmentId,
                patientId:   appt.patientId,
                doctorId:    appt.doctorId,
                scheduledAt: appt.appointmentDate,
              });
              sess = createRes.data;
            } catch (createErr) {
              if (createErr.response?.status === 409) {
                // Session was created by patient side simultaneously — use it
                sess = createErr.response.data?.data;
                if (!sess) {
                  // Fallback: fetch it directly
                  const { data: fallbackRes } = await telemedicineAPI.getByAppointment(appointmentId);
                  sess = fallbackRes.data;
                }
              } else throw createErr;
            }
          } else throw e;
        }
        setSession(sess);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load session.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [appointmentId]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => { leaveChannel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Leave / cleanup helper ─────────────────────────────────────────────────
  const leaveChannel = useCallback(async () => {
    clearInterval(timerRef.current);
    if (localAudioRef.current) { localAudioRef.current.stop(); localAudioRef.current.close(); localAudioRef.current = null; }
    if (localVideoRef.current) { localVideoRef.current.stop(); localVideoRef.current.close(); localVideoRef.current = null; }
    if (clientRef.current) {
      try { await clientRef.current.leave(); } catch { /* ignore */ }
      clientRef.current = null;
    }
    setInChannel(false);
    setRemoteUsers([]);
    setElapsed(0);
  }, []);

  // ── Subscribe to remote user ───────────────────────────────────────────────
  const subscribeRemote = useCallback(async (remoteUser, mediaType) => {
    const client = clientRef.current;
    if (!client) return;

    await client.subscribe(remoteUser, mediaType);

    if (mediaType === 'video') {
      setRemoteUsers((prev) => {
        if (prev.find((u) => u.uid === remoteUser.uid)) {
          return prev.map((u) =>
            u.uid === remoteUser.uid ? { ...u, videoTrack: remoteUser.videoTrack } : u
          );
        }
        return [...prev, { uid: remoteUser.uid, videoTrack: remoteUser.videoTrack }];
      });
      setTimeout(() => {
        const el = remotePlayersRef.current[remoteUser.uid];
        if (el && remoteUser.videoTrack) remoteUser.videoTrack.play(el);
      }, 100);
    }

    if (mediaType === 'audio') {
      // Show tile even when camera is off
      setRemoteUsers((prev) => {
        if (prev.find((u) => u.uid === remoteUser.uid)) return prev;
        return [...prev, { uid: remoteUser.uid, videoTrack: null }];
      });
      remoteUser.audioTrack?.play();
    }
  }, []);

  // ── Join session ───────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!session) return;
    setJoining(true);
    setActionErr('');
    try {
      // 1. Get Agora RTC token
      const { data: tkRes } = await telemedicineAPI.generateToken(session._id);
      const { token, channelName, uid, appId } = tkRes.data;

      // 2. Mark session active
      const { data: joinRes } = await telemedicineAPI.joinSession(session._id);
      setSession(joinRes.data);

      // 3. Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // 4. Bind remote user events
      client.on('user-published', subscribeRemote);
      client.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'video') {
          // Camera toggled off — keep the tile, just clear video
          setRemoteUsers((prev) =>
            prev.map((u) => u.uid === remoteUser.uid ? { ...u, videoTrack: null } : u)
          );
        }
      });
      client.on('user-left', (remoteUser) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
      });

      // 5. Join the channel
      await client.join(appId, channelName, token, uid);

      // 6. Create local mic + camera tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        { encoderConfig: '360p_7' }
      );
      localAudioRef.current = audioTrack;
      localVideoRef.current = videoTrack;

      // 7. Publish
      await client.publish([audioTrack, videoTrack]);

      // 8. Play local video
      if (localPlayerRef.current) {
        videoTrack.play(localPlayerRef.current);
      }

      setInChannel(true);
    } catch (err) {
      setActionErr(
        err?.message?.includes('Permission')
          ? 'Camera/microphone permission denied. Please allow access and try again.'
          : err.response?.data?.message || err.message || 'Failed to join session.'
      );
      await leaveChannel();
    } finally {
      setJoining(false);
    }
  };

  // ── End session ────────────────────────────────────────────────────────────
  const handleEnd = async () => {
    setEnding(true);
    setActionErr('');
    try {
      await leaveChannel();
      const { data: endRes } = await telemedicineAPI.endSession(session._id, {});
      setSession(endRes.data);

      // Keep appointment UI in sync with telemedicine completion.
      try {
        await appointmentAPI.updateStatus(appointmentId, { status: 'completed' });
        setAppointment((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      } catch (statusErr) {
        console.warn('[Telemedicine] Session ended but failed to mark appointment completed:', statusErr?.response?.data?.message || statusErr.message);
      }
    } catch (err) {
      setActionErr(err.response?.data?.message || err.message || 'Failed to end session.');
    } finally {
      setEnding(false);
    }
  };

  // ── Toggle mic ─────────────────────────────────────────────────────────────
  const toggleMic = async () => {
    if (!localAudioRef.current) return;
    await localAudioRef.current.setEnabled(!micOn);
    setMicOn((p) => !p);
  };

  // ── Toggle camera ──────────────────────────────────────────────────────────
  const toggleCam = async () => {
    if (!localVideoRef.current) return;
    await localVideoRef.current.setEnabled(!camOn);
    setCamOn((p) => !p);
  };

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-64 mt-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="max-w-sm mx-auto mt-20 text-center px-4">
      <p className="text-sm text-red-500 dark:text-red-400 font-medium mb-2">{error}</p>
      <button onClick={() => navigate('/doctor/appointments')} className="text-sm text-indigo-600 hover:underline">
        ← My Appointments
      </button>
    </div>
  );

  const statusCfg = SESSION_STATUS[session?.status] || SESSION_STATUS.scheduled;
  const isEnded   = session?.status === 'ended' || session?.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/doctor/appointments/${appointmentId}`)}
            className="text-gray-400 hover:text-white transition"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-white">
              {appointment?.patientName
                ? `Patient: ${appointment.patientName}`
                : 'Telemedicine Session'}
            </p>
            {session?.channelName && (
              <p className="text-[11px] font-mono text-gray-500">{session.channelName}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusCfg.text}`}>
          <span className={`w-2 h-2 rounded-full ${statusCfg.dot} ${inChannel ? 'animate-pulse' : ''}`} />
          {statusCfg.label}
          {inChannel && elapsed > 0 && (
            <span className="font-mono ml-1 text-gray-400">{fmtElapsed(elapsed)}</span>
          )}
        </div>
      </div>

      {/* Video grid */}
      <div
        className="flex-1 p-3 sm:p-4 grid gap-3"
        style={{ gridTemplateColumns: remoteUsers.length > 0 ? 'repeat(2, 1fr)' : '1fr' }}
      >
        {/* Local video (doctor) */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <div ref={localPlayerRef} className={`w-full h-full ${!camOn ? 'hidden' : ''}`} />

          {(!inChannel || !camOn) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                <span className="text-white font-bold text-lg">{user?.name?.[0] ?? 'D'}</span>
              </div>
              <p className="text-gray-400 text-xs">{inChannel ? 'Camera off' : 'You (preview)'}</p>
            </div>
          )}

          <span className="absolute bottom-2 left-2 text-[11px] text-white bg-black/50 px-2 py-0.5 rounded">
            You (Doctor) {!micOn && '🔇'}
          </span>

          {inChannel && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>

        {/* Remote users (patient) */}
        {remoteUsers.map((ru) => (
          <div
            key={ru.uid}
            className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
          >
            <div
              ref={(el) => { if (el) remotePlayersRef.current[ru.uid] = el; }}
              className="w-full h-full"
            />
            {!ru.videoTrack && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                  <span className="text-xl font-semibold text-white">
                    {appointment?.patientName ? appointment.patientName.charAt(0).toUpperCase() : 'P'}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">Camera off</p>
              </div>
            )}
            <span className="absolute bottom-2 left-2 text-[11px] text-white bg-black/50 px-2 py-0.5 rounded">
              {appointment?.patientName || 'Patient'}
            </span>
          </div>
        ))}

        {/* Waiting for patient */}
        {inChannel && remoteUsers.length === 0 && (
          <div className="bg-gray-900 rounded-lg aspect-video flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-2 animate-pulse">
              <FiUser className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-gray-500 text-xs">Waiting for patient to join…</p>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-4 flex items-center justify-center gap-4">
        {inChannel ? (
          <>
            {/* Mic toggle */}
            <ControlBtn
              onClick={toggleMic}
              active={micOn}
              title={micOn ? 'Mute' : 'Unmute'}
              ActiveIcon={FiMic}
              OffIcon={FiMicOff}
              activeClass="bg-gray-700 text-white hover:bg-gray-600"
              offClass="bg-red-600 text-white hover:bg-red-700"
            />

            {/* Cam toggle */}
            <ControlBtn
              onClick={toggleCam}
              active={camOn}
              title={camOn ? 'Turn off camera' : 'Turn on camera'}
              ActiveIcon={FiVideo}
              OffIcon={FiVideoOff}
              activeClass="bg-gray-700 text-white hover:bg-gray-600"
              offClass="bg-red-600 text-white hover:bg-red-700"
            />

            {/* End call */}
            <button
              onClick={handleEnd}
              disabled={ending}
              className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-60 flex items-center justify-center transition active:scale-90"
              title="End session"
            >
              {ending ? (
                <div className="animate-spin rounded-full w-5 h-5 border-2 border-white border-t-transparent" />
              ) : (
                <MdCallEnd className="w-5 h-5 text-white" />
              )}
            </button>
          </>
        ) : isEnded ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">
              Session {session?.status}
              {session?.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
            </p>
            <button
              onClick={() => navigate(`/doctor/appointments/${appointmentId}`)}
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition"
            >
              Back to Appointment
            </button>
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60
                       text-white text-sm font-bold rounded-full transition active:scale-95"
          >
            {joining ? (
              <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
            ) : (
              <FiVideo className="w-4 h-4" />
            )}
            {joining ? 'Starting…' : 'Start Session'}
          </button>
        )}
      </div>

      {/* Action error */}
      {actionErr && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 text-xs px-4 py-2.5 rounded-md shadow-lg max-w-xs text-center">
          {actionErr}
        </div>
      )}
    </div>
  );
};

export default DoctorTelemedicineRoom;
