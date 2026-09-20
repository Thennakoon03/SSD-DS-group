import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { FiCheck, FiRotateCcw, FiSearch, FiX } from 'react-icons/fi';
import Pagination from '../../Componets/SharedComponents/Pagination';

const PAGE_SIZE = 5;

const STATUS_STYLES = {
  pending:       'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed:     'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  completed:     'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  cancelled:     'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  no_show:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  not_responded: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
};

const PAY_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  paid:     'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  refunded: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const TABS = ['All', 'pending', 'confirmed', 'completed', 'cancelled', 'not_responded'];

function Badge({ label, style }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${style}`}>
      {label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('All');
  const [page, setPage]                 = useState(1);
  const [markingId, setMarkingId]       = useState(null);
  const [toast, setToast]               = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleMarkCashPaid = async (appt) => {
    setMarkingId(appt._id);
    try {
      await adminAPI.markCashPaid(appt._id, {
        patientId: appt.patientId,
        doctorId:  appt.doctorId,
        amount:    0,
        amountLkr: appt.consultationFee || 0,
      });
      setAppointments((prev) =>
        prev.map((a) => a._id === appt._id ? { ...a, paymentStatus: 'paid', paymentMethod: 'cash' } : a)
      );
      showToast('Payment marked as paid.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark as paid.');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkRefunded = async (appt) => {
    setMarkingId(appt._id);
    try {
      await adminAPI.markRefunded(appt._id);
      setAppointments((prev) =>
        prev.map((a) => a._id === appt._id ? { ...a, paymentStatus: 'refunded' } : a)
      );
      showToast('Payment marked as refunded.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark as refunded.');
    } finally {
      setMarkingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getAllAppointments();
      setAppointments(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    let list = appointments;
    if (activeTab !== 'All') list = list.filter((a) => a.status === activeTab);
    if (q) list = list.filter(
      (a) =>
        (a.patientName || '').toLowerCase().includes(q) ||
        (a.doctorName  || '').toLowerCase().includes(q) ||
        (a.reason      || '').toLowerCase().includes(q)
    );
    setFiltered(list);
    setPage(1);
  }, [appointments, activeTab, search]);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? appointments.length : appointments.filter((a) => a.status === t).length;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2.5 rounded-md shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            All patient–doctor appointments across the platform
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient, doctor, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 mb-6 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-nowrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'All' ? 'All' : tab.replace('_', ' ')}
            {counts[tab] > 0 && (
              <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {activeTab !== 'All' && <span className="text-indigo-500 dark:text-indigo-400"> · {activeTab.replace('_', ' ')}</span>}
        </p>
      </div>

      {/* Card */}
      <div className="md:bg-white md:dark:bg-gray-900 md:border border-gray-200 dark:border-gray-800 md:rounded-md md:overflow-hidden">
        {/* Table Wrapper */}
        <div className="overflow-hidden md:overflow-x-auto">
          <table className="w-full text-sm block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-left border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0 md:divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={7} className="block md:table-cell px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-sm">Loading appointments…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={7} className="block md:table-cell px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a._id} className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition p-2 md:p-0 md:border-b md:border-gray-100 dark:md:border-gray-800">
                    {/* Patient */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</span>
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-right md:text-left">{a.patientName || '—'}</p>
                    </td>
                    {/* Doctor */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</span>
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-right md:text-left">{a.doctorName || '—'}</p>
                    </td>
                    {/* Date & Time */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 whitespace-nowrap border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</span>
                      <div className="text-right md:text-left">
                        <p className="text-gray-700 dark:text-gray-200">{formatDate(a.appointmentDate)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{a.appointmentTime || '—'}</p>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</span>
                      <Badge
                        label={a.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'}
                        style={
                          a.type === 'telemedicine'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 text-right md:text-left'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-right md:text-left'
                        }
                      />
                    </td>
                    {/* Status */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
                      <Badge
                        label={a.status?.replace('_', ' ') || '—'}
                        style={`${STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-600'} text-right md:text-left`}
                      />
                    </td>
                    {/* Payment */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</span>
                      <Badge
                        label={a.paymentStatus || '—'}
                        style={`${PAY_STYLES[a.paymentStatus] || 'bg-gray-100 text-gray-600'} text-right md:text-left`}
                      />
                    </td>
                    {/* Actions */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</span>
                      <div className="flex flex-col gap-1 items-end md:items-start text-right md:text-left">
                      {a.paymentStatus === 'pending' && a.status !== 'cancelled' ? (
                        <button
                          onClick={() => handleMarkCashPaid(a)}
                          disabled={markingId === a._id}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded transition w-max"
                        >
                          {markingId === a._id ? (
                            <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <FiCheck className="w-3 h-3" />
                          )}
                          Mark Paid
                        </button>
                      ) : a.status === 'cancelled' && a.paymentStatus === 'paid' ? (
                        <button
                          onClick={() => handleMarkRefunded(a)}
                          disabled={markingId === a._id}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded transition w-max"
                        >
                          {markingId === a._id ? (
                            <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <FiRotateCcw className="w-3 h-3" />
                          )}
                          Mark Refunded
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600">—</span>
                      )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
          label="appointment"
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
