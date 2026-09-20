import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI, reportAPI } from '../../utils/api';
import { useAuth } from '../../Context/AuthContext';
import { FiHome, FiVideo, FiCheck, FiCreditCard, FiChevronLeft, FiAlertCircle, FiCalendar, FiClock } from 'react-icons/fi';

// ── Time slot generator (8 am → 6 pm, 30-min steps) ────────────────────────
const generateTimeSlots = () => {
  const slots = [];
  for (let h = 8; h < 18; h++) {
    ['00', '30'].forEach((m) => {
      const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      slots.push({ display: `${hour}:${m} ${ampm}`, value: `${String(h).padStart(2, '0')}:${m}` });
    });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const DEFAULT_DURATION = 30;
const TYPES = [
  { value: 'in_person',     label: 'In-Person',     Icon: FiHome },
  { value: 'telemedicine',  label: 'Telemedicine',  Icon: FiVideo },
];

// ── Today as YYYY-MM-DD for min date attribute ────────────────────────────────
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ── Small shared UI pieces ────────────────────────────────────────────────────
const Label = ({ children }) => (
  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{children}</p>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

// ── Main component ────────────────────────────────────────────────────────────
const MakeAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor,  setDoctor]  = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [doctorError,   setDoctorError]   = useState('');

  const [date,     setDate]     = useState('');
  const [time,     setTime]     = useState('');
  const [type,     setType]     = useState('in_person');
  const [reason,   setReason]   = useState('');

  // Reports
  const [reports,          setReports]          = useState([]);
  const [selectedReports,  setSelectedReports]  = useState(new Set()); // Set of report _id strings

  const [errors,   setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [booked,   setBooked]   = useState(null); // appointment data on success

  // Load doctor
  useEffect(() => {
    doctorAPI.getById(doctorId)
      .then((res) => setDoctor(res.data.data))
      .catch(() => setDoctorError('Could not load doctor details.'))
      .finally(() => setLoadingDoctor(false));
  }, [doctorId]);

  // Load patient's reports (silent fail — reports are optional)
  useEffect(() => {
    reportAPI.getMine()
      .then(({ data }) => setReports(data.data || []))
      .catch(() => {});
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!date) e.date = 'Please select a date.';
    if (!time) e.time = 'Please select a time slot.';
    return e;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const patientName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '';
      const doctorName  = doctor ? `${doctor.firstName} ${doctor.lastName}` : '';
      const attachedReports = reports
        .filter((r) => selectedReports.has(r._id))
        .map((r) => ({ reportId: r._id, title: r.title, fileUrl: r.fileUrl, reportType: r.reportType }));
      const { data } = await appointmentAPI.book({
        doctorId,
        doctorName,
        patientName,
        appointmentDate: date,
        appointmentTime: time,
        duration: DEFAULT_DURATION,
        type,
        reason: reason.trim() || null,
        attachedReports,
      });
      setBooked(data.data);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadingDoctor) return (
    <div className="flex items-center justify-center min-h-64 mt-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  if (doctorError) return (
    <div className="max-w-sm mx-auto mt-20 text-center px-4">
      <p className="text-gray-800 dark:text-white font-semibold mb-2">{doctorError}</p>
      <button onClick={() => navigate('/patient/doctors')} className="text-sm text-indigo-600 hover:underline">← Back to Doctors</button>
    </div>
  );

  // ── Success screen ──────────────────────────────────────────────────────────
  if (booked) {
    const displayDate = new Date(booked.appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const displayTime = TIME_SLOTS.find((s) => s.value === booked.appointmentTime)?.display || booked.appointmentTime;

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Appointment Booked!</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your appointment is confirmed and pending doctor confirmation.</p>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 text-left space-y-3 mb-6">
          <Row label="Doctor"   value={`Dr. ${doctor?.firstName} ${doctor?.lastName}`} />
          <Row label="Date"     value={displayDate} />
          <Row label="Time"     value={displayTime} />
          <Row label="Type"     value={TYPES.find((t) => t.value === booked.type)?.label || booked.type} />
          <Row label="Duration" value={`${booked.duration} minutes`} />
          <Row label="Status"   value={<span className="text-yellow-600 dark:text-yellow-400 font-medium capitalize">{booked.status}</span>} />
          {booked.reason && <Row label="Reason" value={booked.reason} />}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate(`/patient/payment/${booked._id}`)}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition flex items-center gap-2"
          >
            <FiCreditCard className="w-4 h-4" />
            Pay Now
          </button>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition"
          >
            My Appointments
          </button>
          <button
            onClick={() => navigate('/patient/doctors')}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  const initials = `${doctor?.firstName?.[0] ?? ''}${doctor?.lastName?.[0] ?? ''}`.toUpperCase();

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <button
            onClick={() => navigate(`/patient/doctors/${doctorId}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-5"
          >
            <FiChevronLeft className="w-4 h-4" />
            Doctor Profile
          </button>

          <div className="flex items-center gap-4">
            {doctor?.profileImage ? (
              <img src={doctor.profileImage} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-white">{initials}</span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Book with Dr. {doctor?.firstName} {doctor?.lastName}
              </h1>
              {doctor?.specialization?.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.specialization.slice(0, 2).join(' · ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid md:grid-cols-3 gap-6 md:gap-10">

          {/* ── Left — form ─────────────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-7">

              {/* Date */}
              <div>
                <Label>Date</Label>
                <input
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: '' })); }}
                  className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             text-sm text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <FieldError msg={errors.date} />
              </div>

              {/* Time slots */}
              <div>
                <Label>Time slot</Label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => { setTime(slot.value); setErrors((p) => ({ ...p, time: '' })); }}
                      className={`py-2 text-xs font-medium rounded-md border transition ${
                        time === slot.value
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-600'
                      }`}
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.time} />
              </div>

              {/* Appointment type */}
              <div>
                <Label>Appointment type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md border text-sm font-medium transition ${
                        type === t.value
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <t.Icon className="w-4 h-4 shrink-0" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label>Reason for visit <span className="normal-case text-gray-400 dark:text-gray-600 font-normal">(optional)</span></Label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe your symptoms or reason for this appointment…"
                  className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Attach reports */}
              {reports.length > 0 && (
                <div>
                  <Label>Attach reports <span className="normal-case text-gray-400 dark:text-gray-600 font-normal">(optional)</span></Label>
                  <div className="space-y-2">
                    {reports.map((r) => {
                      const checked = selectedReports.has(r._id);
                      return (
                        <label
                          key={r._id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition
                            ${
                              checked
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-600'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedReports((prev) => {
                                const next = new Set(prev);
                                checked ? next.delete(r._id) : next.add(r._id);
                                return next;
                              });
                            }}
                            className="w-4 h-4 rounded accent-indigo-600 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                              {r.reportType?.replace('_', ' ')}
                            </p>
                          </div>
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-indigo-500 hover:underline shrink-0"
                          >
                            View
                          </a>
                        </label>
                      );
                    })}
                  </div>
                  {selectedReports.size > 0 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">
                      {selectedReports.size} report{selectedReports.size > 1 ? 's' : ''} will be attached
                    </p>
                  )}
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-4 py-3">
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !doctor?.isAvailable}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700
                           disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-md text-sm transition active:scale-95"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
                    Booking…
                  </>
                ) : 'Confirm Appointment'}
              </button>
            </form>
          </div>

          {/* ── Right — summary card ─────────────────────────────────────────── */}
          <div className="md:order-0 -order-1">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 md:sticky md:top-24 space-y-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Summary</p>

              {doctor?.consultationFee > 0 && (
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400 mb-0.5">Consultation fee</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">LKR {doctor.consultationFee.toLocaleString()}</p>
                </div>
              )}

              <SummaryRow Icon={FiCalendar}
                label="Date" value={date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'} />

              <SummaryRow Icon={FiClock}
                label="Time" value={TIME_SLOTS.find((s) => s.value === time)?.display || '—'} />

              <SummaryRow Icon={TYPES.find((t) => t.value === type)?.Icon}
                label="Type" value={TYPES.find((t) => t.value === type)?.label} />

              <SummaryRow Icon={FiClock}
                label="Duration" value={`${DEFAULT_DURATION} minutes`} />

              {!doctor?.isAvailable && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2">
                  This doctor is not currently accepting appointments.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Tiny helper components ────────────────────────────────────────────────────
const Row = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
    <span className="text-gray-800 dark:text-gray-200 text-right font-medium">{value}</span>
  </div>
);

const SummaryRow = ({ Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
    </div>
  </div>
);

export default MakeAppointment;
