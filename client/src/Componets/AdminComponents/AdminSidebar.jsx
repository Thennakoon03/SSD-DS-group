import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { FiGrid, FiUserCheck, FiUsers, FiShield, FiCalendar, FiCreditCard, FiLogOut } from 'react-icons/fi';
import { FaHeartbeat } from 'react-icons/fa';

const NAV_LINKS = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: <FiGrid className="w-4 h-4" />,
  },
  {
    to: '/admin/doctors',
    label: 'Manage Doctors',
    icon: <FiUserCheck className="w-4 h-4" />,
  },
  {
    to: '/admin/patients',
    label: 'Manage Patients',
    icon: <FiUsers className="w-4 h-4" />,
  },
  {
    to: '/admin/admins',
    label: 'Manage Admins',
    icon: <FiShield className="w-4 h-4" />,
  },
  {
    to: '/admin/appointments',
    label: 'Appointments',
    icon: <FiCalendar className="w-4 h-4" />,
  },
  {
    to: '/admin/transactions',
    label: 'Transactions',
    icon: <FiCreditCard className="w-4 h-4" />,
  },
];

// onClose — called after nav link clicks or sign-out (used by mobile overlay to close)
const AdminSidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  const handleClose = () => onClose?.();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <button
        onClick={() => { navigate('/admin/dashboard'); handleClose(); }}
        className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-200 dark:border-gray-800"
      >
        <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-md flex items-center justify-center shrink-0">
          <FaHeartbeat className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex flex-row">
          <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">MediConnect</p>
          <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded mt-0.5 inline-block ml-1">
            Admin
          </span>
        </div>
      </button>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition
              ${isActive
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { handleClose(); logout(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <FiLogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
