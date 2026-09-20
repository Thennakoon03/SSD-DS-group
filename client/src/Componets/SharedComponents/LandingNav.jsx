import { Link } from 'react-router-dom';
import { useTheme } from '../../Context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import { FaHeartbeat } from 'react-icons/fa';

const LandingNav = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-lg">
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-md flex items-center justify-center">
            <FaHeartbeat className="w-5 h-5 text-white" />
          </div>
          MediConnect
        </div>

        {/* Centre nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '#features',    label: 'Features'     },
            { href: '#how-it-works',label: 'How It Works' },
            { href: '#portals',     label: 'Portals'      },
            { href: '#about',       label: 'About'        },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark'
              ? <FiSun className="w-4 h-4" />
              : <FiMoon className="w-4 h-4" />}
          </button>

          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            Log In
          </Link>

          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
