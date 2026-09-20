import { FiCalendar, FiFileText, FiVideo } from 'react-icons/fi';

/**
 * DashboardPreview — a faux browser window showing the patient dashboard UI.
 * Gives visitors an instant feel for what the platform looks like inside.
 */
const DashboardPreview = () => (
  <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden shadow-sm">

      {/* Fake browser chrome */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-3 bg-gray-200 dark:bg-gray-700 rounded text-xs text-gray-400 dark:text-gray-500 px-3 py-1 select-none">
          healthcare.app/patient/dashboard
        </div>
      </div>

      {/* Fake page content */}
      <div className="p-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Patient Dashboard
        </p>

        {/* Stat mini-cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Appointments',  value: '3',  icon: <FiCalendar className="w-4 h-4 text-indigo-500" />, bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Reports',       value: '12', icon: <FiFileText className="w-4 h-4 text-green-600" />,  bg: 'bg-green-50 dark:bg-green-900/20'   },
            { label: 'Video Consults',value: '2',  icon: <FiVideo className="w-4 h-4 text-purple-500" />,   bg: 'bg-purple-50 dark:bg-purple-900/20' },
          ].map(({ label, value, icon, bg }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-3"
            >
              <div className={`w-7 h-7 ${bg} rounded-md flex items-center justify-center mb-2`}>
                {icon}
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming appointment row */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
              SM
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dr. Sarah Mitchell</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cardiologist · Today 10:00 AM</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 shrink-0">
            Confirmed
          </span>
        </div>
      </div>
    </div>
  </section>
);

export default DashboardPreview;
