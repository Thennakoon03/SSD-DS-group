import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import AddAdminModal from '../../Componets/AdminComponents/AddAdminModal';
import DeleteConfirmModal from '../../Componets/SharedComponents/DeleteConfirmModal';
import Pagination from '../../Componets/SharedComponents/Pagination';
import { MdDelete } from 'react-icons/md';
import { FiSearch, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../Context/AuthContext';

const ManageAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const PAGE_SIZE = 5;

  const loadAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getAllAdmins();
      setAdmins(res.data?.data || []);
    } catch {
      setError('Failed to load admins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(admins); return; }
    const q = search.toLowerCase();
    setFiltered(admins.filter((a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)));
  }, [admins, search]);

  useEffect(() => { setPage(1); }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const handleCreateAdmin = async (form) => {
    setAddError('');
    if ((form.password || '').length < 8) {
      setAddError('Password must be at least 8 characters.');
      return;
    }

    setAddLoading(true);
    try {
      await adminAPI.createAdmin({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setShowAddModal(false);
      toast.success('Admin added successfully.');
      await loadAdmins();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add admin.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete?._id) return;
    if (adminToDelete._id === user?.id) {
      toast.error('You cannot delete your own account.');
      setAdminToDelete(null);
      return;
    }

    setDeletingId(adminToDelete._id);
    try {
      await adminAPI.deleteAdmin(adminToDelete._id);
      toast.success('Admin deleted successfully.');
      setAdminToDelete(null);
      await loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {showAddModal && (
        <AddAdminModal
          onClose={() => {
            setShowAddModal(false);
            setAddError('');
          }}
          onSave={handleCreateAdmin}
          loading={addLoading}
          error={addError}
        />
      )}

      {adminToDelete && (
        <DeleteConfirmModal
          onClose={() => {
            if (!deletingId) setAdminToDelete(null);
          }}
          onConfirm={handleDeleteAdmin}
          loading={deletingId === adminToDelete._id}
          title="Delete admin?"
          message={`Are you sure you want to delete ${adminToDelete.name || adminToDelete.email}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage Admins</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {admins.length} administrator account{admins.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition"
          >
            + Add Admin
          </button>
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
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group md:divide-y divide-gray-100 dark:divide-gray-800 space-y-4 md:space-y-0">
              {loading ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={5} className="block md:table-cell px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-sm">Loading admins…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={5} className="block md:table-cell px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No admins found</td>
                </tr>
              ) : (
                paginated.map((a) => {
                  const isSelf = a._id === user?.id;
                  return (
                  <tr
                    key={a._id}
                    className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition p-2 md:p-0"
                  >
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</span>
                      <div className="flex items-center gap-3 text-right md:text-left">
                        <div className="hidden md:flex w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                          {a.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">{a.name}</p>
                      </div>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none text-gray-600 dark:text-gray-300">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</span>
                      <span className="text-right md:text-left">{a.email}</span>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 dark:border-gray-800 md:border-none text-gray-600 dark:text-gray-300">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</span>
                      <span className="text-right md:text-left">{formatDate(a.createdAt)}</span>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                        {a.role || 'admin'}
                      </span>
                    </td>
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-4">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</span>
                      <button
                        onClick={() => {
                          if (isSelf) {
                            toast.error('You cannot delete your own account.');
                            return;
                          }
                          setAdminToDelete(a);
                        }}
                        disabled={deletingId === a._id || isSelf}
                        title={isSelf ? 'You cannot delete your own account' : 'Delete admin'}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSelf ? 'Self' : deletingId === a._id ? 'Deleting...' : <MdDelete className='h-4 w-4' />}
                      </button>
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
          label="admin"
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
};

export default ManageAdmins;
