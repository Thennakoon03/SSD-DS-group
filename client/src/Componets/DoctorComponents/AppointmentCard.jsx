import { FiCalendar, FiClock, FiVideo, FiHome, FiCheck } from 'react-icons/fi';

// ── Config ───────────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending:       { label: 'Pending',       cls: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
  confirmed:     { label: 'Confirmed',     cls: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  completed:     { label: 'Completed',     cls: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  cancelled:     { label: 'Cancelled',     cls: 'text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
  no_show:       { label: 'No Show',       cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  not_responded: { label: 'Not Responded', cls: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export const formatTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const isToday = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth()    === now.getMonth()    &&
         d.getDate()     === now.getDate();
};

export const isUpcoming = (a) => ['pending', 'confirmed'].includes(a.status);

// ── AppointmentCard ──────────────────────────────────────────────────────────────
const AppointmentCard = ({ appt, navigate }) => {
  const cfg   = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
  const today = isToday(appt.appointmentDate);

  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-4 sm:p-5
                 hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer group"
      onClick={() => navigate(`/doctor/appointments/${appt._id}`)}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {appt.patientName || 'Patient'}
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${cfg.cls}`}>
              {cfg.label}
            </span>
            {today && isUpcoming(appt) && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                Today
              </span>
            )}
          </div>

          {/* Date / time / type */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FiCalendar className="w-3.5 h-3.5" />
              {formatDate(appt.appointmentDate)}
            </span>
            <span className="flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5" />
              {formatTime(appt.appointmentTime)} · {appt.duration || 30} min
            </span>
            <span className="flex items-center gap-1">
              {appt.type === 'telemedicine' ? (
                <>
                  <FiVideo className="w-3.5 h-3.5" />
                  Telemedicine
                </>
              ) : (
                <>
                  <FiHome className="w-3.5 h-3.5" />
                  In-Person
                </>
              )}
            </span>
          </div>
        </div>

        {/* Payment badge */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {appt.paymentStatus === 'paid' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
              Paid
            </span>
          )}
          {appt.paymentStatus === 'pending' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              Unpaid
            </span>
          )}
        </div>
      </div>

      {/* Reason preview */}
      {appt.reason && (
        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mb-3">
          <span className="font-medium text-gray-500 dark:text-gray-400">Reason: </span>{appt.reason}
        </p>
      )}

      {/* Attached reports count */}
      {appt.attachedReports?.length > 0 && (
        <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-3">
          📎 {appt.attachedReports.length} report{appt.attachedReports.length > 1 ? 's' : ''} attached
        </p>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between gap-2 mt-3">
        {appt.type === 'telemedicine' && appt.status === 'confirmed' && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/doctor/telemedicine/${appt._id}`); }}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-2.5 py-1 rounded transition"
          >
            <FiVideo className="w-3.5 h-3.5" />
            Start Session
          </button>
        )}
        {appt.type === 'telemedicine' && appt.status === 'completed' && (
          <span
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded"
          >
            <FiCheck className="w-3.5 h-3.5" />
            Session Completed
          </span>
        )}
        <span className="ml-auto text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
          View details →
        </span>
      </div>
    </div>
  );
};

export default AppointmentCard;
