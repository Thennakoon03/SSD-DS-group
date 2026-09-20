import {
  FiCalendar,
  FiVideo,
  FiZap,
  FiFileText,
  FiUserCheck,
  FiClock,
} from 'react-icons/fi';

const FEATURES = [
  {
    icon: <FiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    title: 'Appointment Booking',
    desc: 'Browse verified doctors by specialty and book any available slot in seconds.',
  },
  {
    icon: <FiVideo className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    title: 'Telemedicine',
    desc: 'Consult from anywhere via secure, real-time HD video calls — no waiting room.',
  },
  {
    icon: <FiZap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    title: 'AI Symptom Checker',
    desc: 'Describe symptoms and get instant AI-driven health insights before your visit.',
  },
  {
    icon: <FiFileText className="w-5 h-5 text-green-600 dark:text-green-400" />,
    bg: 'bg-green-50 dark:bg-green-900/20',
    title: 'Digital Health Records',
    desc: 'Prescriptions, reports, and history securely stored and accessible anytime.',
  },
  {
    icon: <FiUserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    title: 'Verified Specialists',
    desc: 'Every doctor is credential-checked by our admin team before joining the platform.',
  },
  {
    icon: <FiClock className="w-5 h-5 text-red-500 dark:text-red-400" />,
    bg: 'bg-red-50 dark:bg-red-900/20',
    title: '24 / 7 Notifications',
    desc: 'Real-time alerts keep patients and doctors in sync at every step of care.',
  },
];

const Features = () => (
  <section id="features" className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">

      {/* Section header */}
      <div className="mb-12">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
          Features
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Everything you need in one place
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
          HealthCare brings patients, doctors, and administrators onto a single unified platform.
        </p>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map(({ icon, bg, title, desc }) => (
          <div
            key={title}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
          >
            <div className={`w-9 h-9 ${bg} rounded-md flex items-center justify-center mb-4`}>
              {icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
