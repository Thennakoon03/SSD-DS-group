import { FiX, FiUser } from 'react-icons/fi';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

// ── Urgency config (exported for reuse) ───────────────────────────────────────
export const URGENCY = {
  emergency: {
    label:  'Emergency',
    desc:   'Seek immediate medical attention or call emergency services.',
    bg:     'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    text:   'text-red-700 dark:text-red-400',
    badge:  'bg-red-600 text-white',
    dot:    'bg-red-500',
  },
  urgent: {
    label:  'Urgent',
    desc:   'See a doctor today or visit an urgent care clinic.',
    bg:     'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    text:   'text-orange-700 dark:text-orange-400',
    badge:  'bg-orange-500 text-white',
    dot:    'bg-orange-500',
  },
  soon: {
    label:  'See Doctor Soon',
    desc:   'Schedule an appointment within the next few days.',
    bg:     'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text:   'text-yellow-700 dark:text-yellow-500',
    badge:  'bg-yellow-500 text-white',
    dot:    'bg-yellow-500',
  },
  routine: {
    label:  'Routine',
    desc:   'No immediate concern. Book a routine appointment.',
    bg:     'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    text:   'text-green-700 dark:text-green-400',
    badge:  'bg-green-600 text-white',
    dot:    'bg-green-500',
  },
};

export const LIKELIHOOD_BADGE = {
  high:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ── Helper ────────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Symptom History View Modal ────────────────────────────────────────────────
// Props:
//   item    – symptom-check history object ({ symptoms, urgencyLevel,
//             possibleConditions, recommendedSpecialties, generalAdvice,
//             disclaimer, createdAt, … })
//   onClose – close handler
const SymptomModal = ({ item, onClose }) => {
  if (!item) return null;

  useLockBodyScroll();

  const urgency = URGENCY[item.urgencyLevel] || URGENCY.routine;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900
                   rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{formatDate(item.createdAt)}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic line-clamp-2">
              &ldquo;{item.symptoms}&rdquo;
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">

          {/* Urgency banner */}
          <div className={`flex items-start gap-3 rounded-md border p-4 ${urgency.bg} ${urgency.border}`}>
            <span className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${urgency.dot}`} />
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${urgency.badge}`}>
                {urgency.label}
              </span>
              <p className={`mt-1 text-sm font-medium ${urgency.text}`}>{urgency.desc}</p>
            </div>
          </div>

          {/* Possible conditions */}
          {item.possibleConditions?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Possible Conditions
              </h3>
              <div className="space-y-3">
                {item.possibleConditions.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{c.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium capitalize
                          ${LIKELIHOOD_BADGE[c.likelihood] || LIKELIHOOD_BADGE.low}`}
                      >
                        {c.likelihood}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended specialties */}
          {item.recommendedSpecialties?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                Recommended Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.recommendedSpecialties.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
                               bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300
                               border border-indigo-200 dark:border-indigo-800"
                  >
                    <FiUser className="w-3.5 h-3.5" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms analyzed */}
          {item.symptomsAnalyzed?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                Symptoms Analyzed
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.symptomsAnalyzed.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800
                               text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* General advice */}
          {item.generalAdvice && (
            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">General Advice</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{item.generalAdvice}</p>
            </div>
          )}

          {/* Disclaimer */}
          {item.disclaimer && (
            <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3 leading-relaxed">
              ⚕ {item.disclaimer}
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default SymptomModal;
