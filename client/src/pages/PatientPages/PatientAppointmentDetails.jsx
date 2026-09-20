import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI, doctorAPI } from '../../utils/api';
import {
  FiChevronLeft, FiCalendar, FiUser, FiFileText,
  FiCreditCard, FiPaperclip, FiExternalLink, FiX,
} from 'react-icons/fi';

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  no_show:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const PAYMENT_STYLES = {
  paid:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  refunded: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const formatCreated = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── InfoRow ────────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 sm:w-40 shrink-0 pt-0.5">
      {label}
    </span>
    <span className="text-sm text-gray-800 dark:text-gray-200">{children || value || '—'}</span>
  </div>
);

// ── Section ────────────────────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="px-5 py-4 space-y-3">{children}</div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
const PatientAppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt]       = useState(null);
  const [doctor, setDoctor]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    appointmentAPI.getById(id)
      .then(({ data }) => setAppt(data.data))
      .catch(() => setError('Failed to load appointment.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch doctor details after appointment loads
  useEffect(() => {
    if (!appt?.doctorId) return;
    doctorAPI.getById(appt.doctorId)
      .then(({ data }) => setDoctor(data.data))
      .catch(() => {}); // non-fatal
  }, [appt?.doctorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Appointment not found.'}</p>
        <button
          onClick={() => navigate('/patient/appointments')}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to appointments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to appointments
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Appointment Details</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Booked on {formatCreated(appt.createdAt)}
        </p>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`text-xs font-semibold px-3 py-1 rounded capitalize ${STATUS_STYLES[appt.status]}`}>
          {appt.status.replace('_', ' ')}
        </span>
        <span className="text-xs font-semibold px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
          {appt.type === 'telemedicine' ? '📹 Telemedicine' : '🏥 In-Person'}
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded capitalize ${PAYMENT_STYLES[appt.paymentStatus]}`}>
          Payment: {appt.paymentStatus}
        </span>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Appointment info */}
        <Section title="Appointment" icon={<FiCalendar className="w-4 h-4" />}>
          <InfoRow label="Date">{formatDate(appt.appointmentDate)}</InfoRow>
          <InfoRow label="Time" value={appt.appointmentTime} />
          <InfoRow label="Duration">{appt.duration} minutes</InfoRow>
          <InfoRow label="Type" value={appt.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'} />
        </Section>

        {/* Doctor info */}
        <Section title="Doctor" icon={<FiUser className="w-4 h-4" />}>
          {/* Avatar + name header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            {doctor?.profileImage ? (
              <img
                src={doctor.profileImage}
                alt="doctor"
                className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
                  {(appt.doctorName || 'D').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Dr. {doctor ? `${doctor.firstName} ${doctor.lastName}` : appt.doctorName || 'Unknown'}
              </p>
              {doctor?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.email}</p>
              )}
            </div>
          </div>

          {doctor?.specialization?.length > 0 && (
            <InfoRow label="Specialization">
              <div className="flex flex-wrap gap-1">
                {doctor.specialization.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                  >{s}</span>
                ))}
              </div>
            </InfoRow>
          )}
          {doctor?.qualifications && <InfoRow label="Qualifications" value={doctor.qualifications} />}
          {doctor?.experience > 0  && <InfoRow label="Experience">{doctor.experience} years</InfoRow>}
          {doctor?.phone           && <InfoRow label="Phone" value={doctor.phone} />}
          {doctor?.gender          && <InfoRow label="Gender" value={doctor.gender} />}
        </Section>

        {/* Reason */}
        {appt.reason && (
          <Section title="Reason for Visit" icon={<FiFileText className="w-4 h-4" />}>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{appt.reason}</p>
          </Section>
        )}

        {/* Clinical notes (read-only) */}
        <Section title="Doctor's Notes" icon={<FiFileText className="w-4 h-4" />}>
          {appt.notes ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{appt.notes}</p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No notes added yet.</p>
          )}
        </Section>

        {/* Prescription */}
        <Section title="Prescription" icon={<FiFileText className="w-4 h-4" />}>
          {appt.prescription?.fileUrl ? (
            <div className="space-y-2">
              <a
                href={appt.prescription.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline"
              >
                <FiExternalLink className="w-4 h-4 shrink-0" />
                View / Download Prescription
              </a>
              {appt.prescription.uploadedAt && (
                <p className="text-xs text-gray-400">
                  Issued{' '}
                  {new Date(appt.prescription.uploadedAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
              {appt.prescription.notes && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mt-1">
                  {appt.prescription.notes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              {appt.status === 'completed'
                ? 'Your doctor has not uploaded a prescription yet.'
                : 'Prescription will be available after the appointment is completed.'}
            </p>
          )}
        </Section>

        {/* Payment info */}
        <Section title="Payment" icon={<FiCreditCard className="w-4 h-4" />}>
          <InfoRow label="Status">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${PAYMENT_STYLES[appt.paymentStatus]}`}>
              {appt.paymentStatus}
            </span>
          </InfoRow>
          <InfoRow
            label="Method"
            value={
              appt.paymentMethod
                ? appt.paymentMethod.charAt(0).toUpperCase() + appt.paymentMethod.slice(1)
                : '—'
            }
          />
        </Section>

        {/* Cancellation */}
        {appt.status === 'cancelled' && (
          <Section title="Cancellation" icon={<FiX className="w-4 h-4 text-red-400" />}>
            <InfoRow
              label="Cancelled by"
              value={
                appt.cancelledBy
                  ? appt.cancelledBy.charAt(0).toUpperCase() + appt.cancelledBy.slice(1)
                  : '—'
              }
            />
            <InfoRow label="Reason" value={appt.cancellationReason || 'No reason provided'} />
          </Section>
        )}

        {/* Attached reports */}
        {appt.attachedReports?.length > 0 && (
          <Section title="Attached Reports" icon={<FiPaperclip className="w-4 h-4" />}>
            <div className="flex flex-col gap-2">
              {appt.attachedReports.map((r) => (
                <a
                  key={r.reportId}
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <FiFileText className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{r.title}</span>
                  {r.reportType && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 capitalize shrink-0">
                      {r.reportType.replace('_', ' ')}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
};

export default PatientAppointmentDetails;
