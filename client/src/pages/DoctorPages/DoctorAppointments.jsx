import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../../utils/api';
import { FiCalendar, FiSearch } from 'react-icons/fi';
import AppointmentCard, { isToday, isUpcoming } from '../../Componets/DoctorComponents/AppointmentCard';

const TABS = [
  { key: 'all',           label: 'All' },
  { key: 'pending',       label: 'Pending' },
  { key: 'confirmed',     label: 'Confirmed' },
  { key: 'completed',     label: 'Completed' },
  { key: 'cancelled',     label: 'Cancelled' },
  { key: 'no_show',       label: 'No Show' },
  { key: 'not_responded', label: 'Not Responded' },
];


// ── Main Page ─────────────────────────────────────────────────────────────────
const DoctorAppointments = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]     = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    appointmentAPI.getDoctorMine()
      .then(({ data }) => setAppointments(data.data || []))
      .catch(() => setError('Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  // Filter + sort by most recently booked
  const filtered = [...appointments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).filter((a) => {
    const tabMatch =
      activeTab === 'all' ? true : a.status === activeTab;
    const q = search.toLowerCase();
    const searchMatch = !q ||
      (a.patientName || '').toLowerCase().includes(q) ||
      (a.reason || '').toLowerCase().includes(q) ||
      (a.appointmentTime || '').includes(q);
    return tabMatch && searchMatch;
  });

  // Tab counts
  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? appointments.length
      : appointments.filter(a => a.status === t.key).length;
    return acc;
  }, {});

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const safeTotalPages = Math.max(1, totalPages);
  const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
  const groupEnd = Math.min(groupStart + 4, safeTotalPages);
  const visiblePages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when tab or search changes
  useEffect(() => { setCurrentPage(1); }, [activeTab, search]);

  // Today's upcoming
  const todayCount = appointments.filter(a => isToday(a.appointmentDate) && isUpcoming(a)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {appointments.length} total
            {todayCount > 0 && (
              <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">
                · {todayCount} today
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, reason…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1 mb-6 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`shrink-0 flex items-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium transition
              ${activeTab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${activeTab === key
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 dark:text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <FiCalendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No appointments found</p>
          {search && <p className="text-xs mt-1">Try clearing your search.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((appt) => (
            <AppointmentCard key={appt._id} appt={appt} navigate={navigate} />
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
    </div>
  );
};

export default DoctorAppointments;
