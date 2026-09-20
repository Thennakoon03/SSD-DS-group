import { FiHome, FiVideo, FiCreditCard, FiCheck, FiFileText, FiExternalLink } from 'react-icons/fi';

// ── Status config ─────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending:       { label: 'Pending',       color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
  confirmed:     { label: 'Confirmed',     color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  completed:     { label: 'Completed',     color: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  cancelled:     { label: 'Cancelled',     color: 'text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
  no_show:       { label: 'No Show',       color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  not_responded: { label: 'Not Responded', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
};

export const TYPE_ICONS = {
  in_person:    FiHome,
  telemedicine: FiVideo,
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

export const isUpcoming = (a) => ['pending', 'confirmed'].includes(a.status);
export const isCancellable = (a) => ['pending', 'confirmed'].includes(a.status);

// ── Appointment card ──────────────────────────────────────────────────────────
const AppointmentCard = ({ appt, onCancel, onDeleteCancelled, deletingId, navigate }) => {
  const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
  const TypeIcon = TYPE_ICONS[appt.type] || FiHome;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {appt.doctorName ? `Dr. ${appt.doctorName}` : 'Doctor'}
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <TypeIcon className="w-3.5 h-3.5 shrink-0" />
            {appt.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'}
          </div>
        </div>

        {/* Payment badge */}
        {appt.paymentStatus === 'paid' && (
          <span className="shrink-0 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
            Paid
          </span>
        )}
        {appt.paymentStatus !== 'paid' && appt.cashPaymentRequested && (
          <span className="shrink-0 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">
            Cash Selected
          </span>
        )}
      </div>

      {/* Date / time / duration row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Date</p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatDate(appt.appointmentDate)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Time</p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatTime(appt.appointmentTime)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Duration</p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{appt.duration} min</p>
        </div>
      </div>

      {/* Reason / notes */}
      {appt.reason && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <span className="font-medium text-gray-600 dark:text-gray-300">Reason: </span>{appt.reason}
        </p>
      )}
      {appt.notes && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <span className="font-medium text-gray-600 dark:text-gray-300">Doctor notes: </span>{appt.notes}
        </div>
      )}
      {appt.status === 'cancelled' && appt.cancellationReason && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <span className="font-medium">Cancelled by {appt.cancelledBy}: </span>{appt.cancellationReason}
        </p>
      )}

      {/* Attached reports */}
      {appt.attachedReports?.length > 0 && (
        <div className="mb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
            Attached Reports
          </p>
          <div className="flex flex-wrap gap-2">
            {appt.attachedReports.map((r) => (
              <a
                key={r.reportId}
                href={r.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md
                           bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300
                           border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
              >
                <FiFileText className="w-3 h-3 shrink-0" />
                {r.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Prescription indicator */}
      {appt.prescription?.fileUrl && (
        <div className="mb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md
                         bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300
                         border border-teal-200 dark:border-teal-800">
            <FiFileText className="w-3 h-3 shrink-0" />
            Prescription available
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">

        {/* View Details */}
        <button
          onClick={() => navigate(`/patient/appointments/${appt._id}`)}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2.5 py-1 rounded transition"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          View Details
        </button>

        {/* Pay Now — for active appointments not yet paid */}
        {isCancellable(appt) && appt.paymentStatus !== 'paid' && !appt.cashPaymentRequested && (
          <button
            onClick={() => navigate(`/patient/payment/${appt._id}`)}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-2.5 py-1 rounded transition"
          >
            <FiCreditCard className="w-3.5 h-3.5" />
            Pay Now
          </button>
        )}

        {/* Join Session / Session Completed */}
        {appt.type === 'telemedicine' && appt.status === 'confirmed' && (appt.paymentStatus === 'paid' || appt.telemedicineSessionStatus === 'active') && (
          <button
            onClick={() => navigate(`/patient/telemedicine/${appt._id}`)}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded transition"
          >
            <FiVideo className="w-3.5 h-3.5" />
            Join Session
          </button>
        )}
        {appt.type === 'telemedicine' && appt.status === 'completed' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded">
            <FiCheck className="w-3.5 h-3.5" />
            Session Completed
          </span>
        )}

        {/* View Doctor */}
        {isCancellable(appt) && appt.doctorId && (
          <button
            onClick={() => navigate(`/patient/doctors/${appt.doctorId}`)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View Doctor
          </button>
        )}

        {/* Book Again */}
        {appt.status === 'completed' && appt.doctorId && (
          <button
            onClick={() => navigate(`/patient/appointments/book/${appt.doctorId}`)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Book Again
          </button>
        )}

        {/* Cancel */}
        {isCancellable(appt) && (
          <button
            onClick={() => onCancel(appt)}
            className="ml-auto text-xs font-medium text-red-500 dark:text-red-400 hover:underline"
          >
            Cancel
          </button>
        )}

        {/* Delete cancelled appointment */}
        {appt.status === 'cancelled' && (
          <button
            onClick={() => onDeleteCancelled(appt)}
            disabled={deletingId === appt._id}
            className="ml-auto text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deletingId === appt._id ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
