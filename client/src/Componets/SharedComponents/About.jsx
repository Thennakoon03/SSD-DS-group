import { Link } from 'react-router-dom';
import { FiActivity, FiArrowRight } from 'react-icons/fi';

/**
 * About / CTA — the closing call-to-action section before the footer.
 */
const About = () => (
  <section id="about" className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-20">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">

      {/* Icon */}
      <div className="w-10 h-10 mx-auto bg-indigo-600 dark:bg-indigo-500 rounded-md flex items-center justify-center mb-6">
        <FiActivity className="w-5 h-5 text-white" />
      </div>

      {/* Headline */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
        Ready to take control of your health?
      </h2>

      {/* Body */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
        Join thousands of patients and doctors already using HealthCare for a
        smarter, simpler healthcare experience.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors"
        >
          Create free account <FiArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-md border border-gray-200 dark:border-gray-700 transition-colors"
        >
          Already have an account? Log in
        </Link>
      </div>
    </div>
  </section>
);

export default About;
