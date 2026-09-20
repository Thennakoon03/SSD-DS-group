import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { FiUserCheck, FiUsers, FiAlertTriangle, FiShield } from 'react-icons/fi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ doctors: null, patients: null, admins: null, pending: null });
  const [loading, setLoading] = useState(true);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [doctorsRes, patientsRes, adminsRes] = await Promise.all([
          adminAPI.getAllDoctors(),
          adminAPI.getAllPatients(),
          adminAPI.getAllAdmins(),
        ]);
        const doctors  = doctorsRes.data?.data  || [];
        const patients = patientsRes.data?.data || [];
        const admins   = adminsRes.data?.data   || [];
        const pending  = doctors.filter((d) => !d.isVerified);
        setStats({ doctors: doctors.length, patients: patients.length, admins: admins.length, pending: pending.length });
        setRecentDoctors(doctors.slice(0, 5));
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

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

  const statCards = [
    {
      label: 'Total Doctors',
      value: stats.doctors,
      to: '/admin/doctors',
      iconCls: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: <FiUserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      label: 'Total Patients',
      value: stats.patients,
      to: '/admin/patients',
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: <FiUsers className="w-5 h-5 text-green-600 dark:text-green-400" />,
    },
    {
      label: 'Pending Verifications',
      value: stats.pending,
      to: '/admin/doctors',
      highlight: stats.pending > 0,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
    },
    {
      label: 'Total Admins',
      value: stats.admins,
      to: '/admin/admins',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: <FiShield className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    },
  ];

  return (
    <div className=" mx-auto px-4 sm:px-6 py-1">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back — here's a quick overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ label, value, to, icon, bg, highlight }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={`text-left p-4 rounded-md border transition hover:shadow-sm group ${
              highlight
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 ${bg}`}>
              {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent doctors */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Doctors</h2>
            <button
              onClick={() => navigate('/admin/doctors')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all →
            </button>
          </div>
          {recentDoctors.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No doctors found.</p>
          ) : (
            <div className="space-y-1">
              {recentDoctors.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => navigate('/admin/doctors')}
                  className="w-full flex items-center justify-between py-2 px-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {doc.profileImage ? (
                      <img src={doc.profileImage} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
                        {doc.firstName?.[0] || 'D'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        Dr. {doc.firstName} {doc.lastName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {Array.isArray(doc.specialization) ? doc.specialization[0] : doc.specialization}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 ml-3 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    doc.isVerified
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {doc.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              {
                label: 'Review Pending Verifications',
                desc: 'Approve or reject doctor requests.',
                path: '/admin/doctors',
                badge: stats.pending > 0 ? String(stats.pending) : null,
              },
              {
                label: 'Manage Doctors',
                desc: 'View, verify or revoke doctor accounts.',
                path: '/admin/doctors',
              },
              {
                label: 'Manage Patients',
                desc: 'View all registered patient accounts.',
                path: '/admin/patients',
              },
              {
                label: 'Manage Admins',
                desc: 'View administrator accounts.',
                path: '/admin/admins',
              },
            ].map(({ label, desc, path, badge }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center justify-between text-left px-4 py-3 rounded-md border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                </div>
                {badge && (
                  <span className="ml-3 shrink-0 text-[11px] font-bold px-2 py-0.5 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
