import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import { FiUsers, FiZap, FiCalendar, FiFileText, FiUser, FiHeart, FiSun, FiMoon, FiChevronDown, FiLogOut, FiX, FiMenu } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import { FaHeartbeat } from 'react-icons/fa';

const NAV_LINKS = [
  {
    to: '/patient/dashboard',
    label: 'Dashboard',
    icon: <MdDashboard className="w-4 h-4" />,
  },
  {
    to: '/patient/doctors',
    label: 'Doctors',
    icon: <FiUsers className="w-4 h-4" />,
  },
  {
    to: '/patient/symptom-checker',
    label: 'Symptom Checker',
    icon: <FiZap className="w-4 h-4" />,
  },
];

// Dropdown-only links (under avatar menu)
const DROPDOWN_LINKS = [
  {
    to: '/patient/appointments',
    label: 'My Appointments',
    icon: <FiCalendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />,
  },
  {
    to: '/patient/reports',
    label: 'My Reports',
    icon: <FiFileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />,
  },
  {
    to: '/patient/profile',
    label: 'My Profile',
    icon: <FiUser className="w-4 h-4 text-gray-400 dark:text-gray-500" />,
  },
];

const UserNavbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'P';

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-lg"
          >
            <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-md flex items-center justify-center">
              <FaHeartbeat className="w-5 h-5 text-white" />
            </div>
            Mediconnect
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right — theme toggle + avatar */}
          <div className="hidden md:flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <FiSun className="w-4 h-4" />
              ) : (
                <FiMoon className="w-4 h-4" />
              )}
            </button>

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
                <FiChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">

                    {/* User info header */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {/* Dropdown nav links */}
                    {DROPDOWN_LINKS.map(({ to, label, icon }) => (
                      <button
                        key={to}
                        onClick={() => { navigate(to); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                      >
                        {icon}
                        {label}
                      </button>
                    ))}

                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? (
                <FiSun className="w-4 h-4" />
              ) : (
                <FiMoon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {menuOpen ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiMenu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          {/* Direct links */}
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}

          {/* Dropdown links (shown directly in mobile menu) */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-1 space-y-1">
            {DROPDOWN_LINKS.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;


