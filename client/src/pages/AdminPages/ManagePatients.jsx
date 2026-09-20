import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { FiSearch, FiX } from 'react-icons/fi';
import Pagination from '../../Componets/SharedComponents/Pagination';

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminAPI.getAllPatients();
        setPatients(res.data?.data || []);
      } catch {
        setError('Failed to load patients. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(patients); return; }
    const q = search.toLowerCase();
    setFiltered(
      patients.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q),
      ),
    );
  }, [patients, search]);

  useEffect(() => { setPage(1); }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
  const calcAge = (d) => {
    if (!d) return null;
    const diff = Date.now() - new Date(d).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage Patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Card Wrapper container changes for mobile vs desktop */}
      <div className="md:bg-white md:dark:bg-gray-900 md:border border-gray-200 dark:border-gray-800 md:rounded-md md:overflow-hidden">
        <div className="overflow-hidden md:overflow-x-auto">
          <table className="w-full text-sm block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age / DOB</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender / Blood</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group md:divide-y divide-gray-100 dark:divide-gray-800 space-y-4 md:space-y-0">
              {loading ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={6} className="block md:table-cell px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-sm">Loading patients…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={6} className="block md:table-cell px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No patients found</td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const emergencyNumber =
                    typeof p.emergencyContact === 'object' && p.emergencyContact !== null
                      ? p.emergencyContact.phone
                      : p.emergencyContact;

                  return (
                  <tr
                    key={p._id}
                    className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition p-2 md:p-0"
                  >
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</span>
                      <div className="flex items-center gap-3 text-right md:text-left">
                        {p.profileImage ? (
                          <img src={p.profileImage} alt="" className="hidden md:block w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="hidden md:flex w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                            {p.firstName?.[0]?.toUpperCase() || 'P'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</span>
                      <div className="text-right md:text-left">
                        <p className="text-gray-600 dark:text-gray-300">{p.phone || '—'}</p>
                        {emergencyNumber && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Emergency: {emergencyNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age / DOB</span>
                      <div className="text-right md:text-left">
                        <p className="text-gray-600 dark:text-gray-300">
                          {calcAge(p.dateOfBirth) != null ? `${calcAge(p.dateOfBirth)} yrs` : '—'}
                        </p>
                        {p.dateOfBirth && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(p.dateOfBirth)}</p>
                        )}
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender / Blood</span>
                      <div className="text-right md:text-left">
                        <p className="text-gray-600 dark:text-gray-300 capitalize">{p.gender || '—'}</p>
                        {p.bloodGroup ? (
                          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                            {p.bloodGroup}
                          </span>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">—</p>
                        )}
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</span>
                      <span className="text-right md:text-left">
                        {p.address
                          ? [p.address.city, p.address.state, p.address.country].filter(Boolean).join(', ') || (typeof p.address === 'string' ? p.address : '—')
                          : p.city ? `${p.city}${p.state ? ', ' + p.state : ''}` : '—'}
                      </span>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 text-gray-600 dark:text-gray-300">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</span>
                      <span className="text-right md:text-left">{formatDate(p.createdAt)}</span>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
          label="patient"
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
};

export default ManagePatients;
