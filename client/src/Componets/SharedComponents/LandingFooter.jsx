import { Link } from 'react-router-dom';
import { FaHeartbeat } from 'react-icons/fa';

const LandingFooter = () => (
  <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">

      {/* Logo */}
      <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-base">
        <div className="w-7 h-7 bg-indigo-600 dark:bg-indigo-500 rounded-md flex items-center justify-center">
          <FaHeartbeat className="w-4 h-4 text-white" />
        </div>
        MediConnect
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        © {new Date().getFullYear()} MediConnect. All rights reserved.
      </p>

      <div className="flex items-center gap-5 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Link to="/login"  className="hover:text-gray-900 dark:hover:text-white transition-colors">Log In</Link>
        <Link to="/signup" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sign Up</Link>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
