import { Link } from 'react-router-dom';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const PORTALS = [
  {
    role: 'Patient',
    badge: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
    desc: 'Book appointments, consult via video, use the AI symptom checker, and manage your health records.',
    perks: [
      'Book & manage appointments',
      'AI symptom checker',
      'Digital health reports',
      'Secure online payments',
    ],
  },
  {
    role: 'Doctor',
    badge: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    desc: 'Manage your schedule, run telemedicine sessions, upload prescriptions, and view patient reports.',
    perks: [
      'View & manage appointments',
      'HD telemedicine sessions',
      'Upload prescriptions',
      'Profile & availability management',
    ],
  },
  {
    role: 'Admin',
    badge: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    desc: 'Oversee the entire platform — verify doctors, manage all users, and monitor payments.',
    perks: [
      'Doctor verification',
      'User management',
      'Transaction tracking',
      'Analytics dashboard',
    ],
  },
];

const Portals = () => (
  <section id="portals" className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">

      {/* Section header */}
      <div className="mb-12">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
          Portals
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          One platform. Three portals.
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Whether you're seeking care, delivering it, or managing the system — there's a dedicated portal for you.
        </p>
      </div>

      {/* Portal cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {PORTALS.map(({ role, badge, desc, perks }) => (
          <div
            key={role}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-6 flex flex-col hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
          >
            {/* Role badge */}
            <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded border ${badge} mb-4`}>
              {role}
            </span>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">{desc}</p>

            {/* Perk list */}
            <ul className="space-y-2 flex-1 mb-6">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <FiCheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {role} Login <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Portals;
