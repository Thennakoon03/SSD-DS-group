import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI, paymentAPI, telemedicineAPI } from '../../utils/api';
import useLockBodyScroll from '../../utils/useLockBodyScroll';
import { FiPlus, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import AppointmentCard, { isUpcoming, isCancellable, formatDate, formatTime } from '../../Componets/PatientComponents/AppointmentCard';
import DeleteConfirmModal from '../../Componets/SharedComponents/DeleteConfirmModal';

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

// Cancel modal
const CancelModal = ({ appointment, onConfirm, onClose, loading }) => {
  useLockBodyScroll();
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Cancel appointment?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {formatDate(appointment.appointmentDate)} at {formatTime(appointment.appointmentTime)}{appointment.doctorName ? ` with Dr. ${appointment.doctorName}` : ''}
        </p>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Reason <span className="normal-case font-normal text-gray-400">(optional)</span></label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let us know why you're cancelling…"
          className="w-full px-3 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(reason.trim() || null)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60
                       text-white text-sm font-semibold rounded-md transition"
          >
            {loading ? <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" /> : null}
            Cancel Appointment
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                       text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Keep It
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const MyAppointments = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [cancelTarget, setCancelTarget]   = useState(null);
  const [cancelling, setCancelling]       = useState(false);
  const [cancelError, setCancelError]     = useState('');
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deletingId, setDeletingId]       = useState('');

  useEffect(() => {
    Promise.all([
      appointmentAPI.getMine(),
      paymentAPI.getMine().catch(() => ({ data: { data: [] } })),
      telemedicineAPI.getMySessions().catch(() => ({ data: { data: [] } })),
    ])
      .then(([apptRes, payRes, sessRes]) => {
        const appts    = apptRes.data.data || [];
        const payments = payRes.data.data  || [];
        const sessions = sessRes.data.data || [];

        // Build a lookup: appointmentId → payment status
        const paidIds = new Set(
          payments
            .filter((p) => p.status === 'completed')
            .map((p) => p.appointmentId)
        );

        // Build a lookup: appointmentId -> latest telemedicine session status
        const sessionStatusByAppointment = sessions.reduce((acc, s) => {
          if (!s?.appointmentId) return acc;
          const existing = acc[s.appointmentId];
          if (!existing || new Date(s.updatedAt || s.createdAt || 0) > new Date(existing.updatedAt || existing.createdAt || 0)) {
            acc[s.appointmentId] = s;
          }
          return acc;
        }, {});

        // Merge: if payment service says completed, override appointment paymentStatus
        const merged = appts.map((a) => {
          const session = sessionStatusByAppointment[a._id];
          return {
            ...a,
            paymentStatus: paidIds.has(a._id) ? 'paid' : a.paymentStatus,
            telemedicineSessionStatus: session?.status || null,
          };
        });

        setAppointments(merged);
      })
      .catch(() => setError('Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = appointments.filter((a) => {
    if (activeTab === 'upcoming')  return isUpcoming(a);
    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'cancelled') return ['cancelled', 'no_show', 'not_responded'].includes(a.status);
    return true;
  });

  // Sort by most recently booked first
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const safeTotalPages = Math.max(1, totalPages);
  const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
  const groupEnd = Math.min(groupStart + 4, safeTotalPages);
  const visiblePages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  const paginated  = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when tab changes
  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = {
    all:       appointments.length,
    upcoming:  appointments.filter(isUpcoming).length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => ['cancelled', 'no_show', 'not_responded'].includes(a.status)).length,
  };

  // ── Cancel handler ────────────────────────────────────────────────────────
  const handleCancelConfirm = async (reason) => {
    setCancelling(true);
    setCancelError('');
    try {
      await appointmentAPI.cancel(cancelTarget._id, { cancellationReason: reason });
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === cancelTarget._id
            ? { ...a, status: 'cancelled', cancelledBy: 'patient', cancellationReason: reason }
            : a
        )
      );
      setCancelTarget(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel. Please try again.');
      setCancelling(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) return;
    setCancelError('');
    setDeletingId(deleteTarget._id);
    try {
      await appointmentAPI.deleteCancelled(deleteTarget._id);
      setAppointments((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to delete cancelled appointment.');
    } finally {
      setDeletingId('');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* Page heading */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Appointments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/patient/doctors')}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition active:scale-95"
        >
          <FiPlus className="w-4 h-4" />
          <span className="hidden sm:inline">New Appointment</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                activeTab === tab.key
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Global cancel error */}
      {cancelError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-4 py-3 mb-4">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          {cancelError}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Retry</button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">No appointments found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {activeTab === 'all' ? "You haven't booked any appointments yet." : `No ${activeTab} appointments.`}
          </p>
          {activeTab === 'all' && (
            <button
              onClick={() => navigate('/patient/doctors')}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Find a Doctor →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((appt) => (
            <AppointmentCard
              key={appt._id}
              appt={appt}
              navigate={navigate}
              onCancel={(a) => { setCancelError(''); setCancelTarget(a); }}
              onDeleteCancelled={(a) => setDeleteTarget(a)}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            ← Prev
          </button>
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 rounded-md text-sm border transition ${
                currentPage === page
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, safeTotalPages))}
            disabled={currentPage === safeTotalPages}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => { setCancelTarget(null); setCancelError(''); }}
          loading={cancelling}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deletingId === deleteTarget._id}
          title="Delete cancelled appointment?"
          message="This cancelled appointment will be permanently removed from your list. This action cannot be undone."
          confirmText="Delete"
          cancelText="Keep"
        />
      )}
    </div>
  );
};

export default MyAppointments;
