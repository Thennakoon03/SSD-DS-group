import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { FiSearch, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ViewDoctorModal from '../../Componets/AdminComponents/ViewDoctorModal';
import Pagination from '../../Componets/SharedComponents/Pagination';

//  Helpers 
const TABS = [
  { key: 'All',      label: 'All' },
  { key: 'Verified', label: 'Verified' },
  { key: 'Pending',  label: 'Pending' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllDoctors();
      setDoctors(res.data?.data || []);
    } catch {
      setError('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  useEffect(() => {
    let list = [...doctors];
    if (activeTab === 'Verified') list = list.filter((d) => d.isVerified);
    if (activeTab === 'Pending')  list = list.filter((d) => !d.isVerified);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        (Array.isArray(d.specialization) ? d.specialization.join(' ') : d.specialization || '').toLowerCase().includes(q),
      );
    }
    setFiltered(list);
    setPage(1);
  }, [doctors, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleVerify = async (id, approve) => {
    setActionLoading(id);
    try {
      await adminAPI.verifyDoctor(id, { isVerified: approve });
      toast.success(`Doctor ${approve ? 'approved' : 'rejected'} successfully.`);
      fetchDoctors();
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Tab counts
  const counts = {
    All:      doctors.length,
    Verified: doctors.filter((d) => d.isVerified).length,
    Pending:  doctors.filter((d) => !d.isVerified).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Doctors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {doctors.length} total doctors
            {counts.Pending > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                · {counts.Pending} pending
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors…"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-nowrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === key
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedDoctor && (
        <ViewDoctorModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        {activeTab !== 'All' && <span className="text-indigo-500 dark:text-indigo-400"> · {activeTab}</span>}
      </p>

      {/* Table Wrapper */}
      <div className="md:bg-white md:dark:bg-gray-900 md:border border-gray-200 dark:border-gray-800 md:rounded-md md:overflow-hidden">
        <div className="overflow-hidden md:overflow-x-auto">
          <table className="w-full text-sm block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Doctor</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Specialization</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Exp / Fee</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0">
              {filtered.length === 0 ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={6} className="block md:table-cell px-5 py-12 text-center">
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">No doctors found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search or filter</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={5} className="block md:table-cell px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No doctors found</td>
                </tr>
              ) : (
                paginated.map((doc) => (
                  <tr
                    key={doc._id}
                    className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition p-2 md:p-0 md:border-b md:border-gray-100 dark:md:border-gray-800"
                  >
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</span>
                      <div className="flex items-center gap-3 text-right md:text-left">
                        {doc.profileImage ? (
                          <img src={doc.profileImage} alt="" className="hidden md:block w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="hidden md:flex w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shrink-0">
                            {doc.firstName?.[0] || 'D'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Dr. {doc.firstName} {doc.lastName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{doc.email}</p>
                          {doc.phone && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doc.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none text-gray-600 dark:text-gray-300 text-sm">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialization</span>
                      <span className="text-right md:text-left">{Array.isArray(doc.specialization) ? doc.specialization.join(', ') : doc.specialization || '—'}</span>
                    </td>
                   
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none text-sm">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exp / Fee</span>
                      <div className="text-right md:text-left">
                        <p className="text-gray-600 dark:text-gray-300">
                          {doc.experienceYears ? `${doc.experienceYears} yrs exp` : doc.experience ? `${doc.experience} yrs exp` : '—'}
                        </p>
                        {doc.consultationFee != null && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">${doc.consultationFee} / visit</p>
                        )}
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none flex-row">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
                      <div className="flex flex-col gap-1 items-end md:items-start text-right md:text-left">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border w-fit ${
                        doc.isVerified
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {doc.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border w-fit ${
                        doc.isAvailable
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {doc.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</span>
                      <div className="flex items-center justify-end md:justify-start gap-2">
                        <button
                          onClick={() => setSelectedDoctor(doc)}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View
                        </button>
                        {!doc.isVerified ? (
                          <button
                            disabled={actionLoading === doc._id}
                            onClick={() => handleVerify(doc._id, true)}
                            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-2.5 py-1 rounded-md transition active:scale-95"
                          >
                            {actionLoading === doc._id ? '…' : 'Approve'}
                          </button>
                        ) : (
                          <button
                            disabled={actionLoading === doc._id}
                            onClick={() => handleVerify(doc._id, false)}
                            className="text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 px-2.5 py-1 rounded-md transition active:scale-95"
                          >
                            {actionLoading === doc._id ? '…' : 'Revoke'}
                          </button>
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
          label="doctor"
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
};

export default ManageDoctors;
