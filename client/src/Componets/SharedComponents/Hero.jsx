import { Link } from 'react-router-dom';
import { FiActivity, FiArrowRight, FiShield, FiCheckCircle, FiUsers } from 'react-icons/fi';

const Hero = () => (
  <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">

    {/* Eyebrow badge */}
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full mb-6">
      <FiActivity className="w-3.5 h-3.5" />
      Healthcare, simplified
    </span>

    {/* Headline */}
    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-5 tracking-tight">
      Your health, managed<br className="hidden sm:block" /> in one place
    </h1>

    {/* Subheadline */}
    <p className="text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
      Book appointments with verified doctors, consult via video, track your health
      records, and manage everything — patients, doctors, and admins all in one platform.
    </p>

    {/* CTAs */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link
        to="/signup"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors"
      >
        Get started free <FiArrowRight className="w-4 h-4" />
      </Link>
      <Link
        to="/login"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-md border border-gray-200 dark:border-gray-700 transition-colors"
      >
        Log in to dashboard
      </Link>
    </div>

    {/* Trust row */}
    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500 font-medium">
      {[
        { icon: <FiShield className="w-3.5 h-3.5 text-green-500" />,   text: 'HIPAA Compliant'       },
        { icon: <FiCheckCircle className="w-3.5 h-3.5 text-indigo-500" />, text: 'Verified Doctors Only' },
        { icon: <FiUsers className="w-3.5 h-3.5 text-gray-400" />,     text: '50,000+ Patients'      },
      ].map(({ icon, text }) => (
        <span key={text} className="flex items-center gap-1.5">{icon}{text}</span>
      ))}
    </div>
  </section>
);

export default Hero;
