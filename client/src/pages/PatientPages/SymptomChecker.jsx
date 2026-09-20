import { useState, useEffect } from 'react';
import { aiAPI } from '../../utils/api';
import { FiUser, FiEye, FiTrash2, FiAlertCircle, FiZap } from 'react-icons/fi';
import SymptomModal, { URGENCY, LIKELIHOOD_BADGE } from '../../Componets/PatientComponents/SymptomModal';
import DeleteConfirmModal from '../../Componets/SharedComponents/DeleteConfirmModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── ResultCard ────────────────────────────────────────────────────────────────
const ResultCard = ({ result, onClose }) => {
  const urgency = URGENCY[result.urgencyLevel] || URGENCY.routine;

  return (
    <div className="space-y-5 animate-in">
      {/* Urgency banner */}
      <div className={`flex items-start gap-3 rounded-md border p-4 ${urgency.bg} ${urgency.border}`}>
        <span className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${urgency.dot}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${urgency.badge}`}>
              {urgency.label}
            </span>
          </div>
          <p className={`mt-1 text-sm font-medium ${urgency.text}`}>{urgency.desc}</p>
        </div>
      </div>

      {/* Possible conditions */}
      {result.possibleConditions?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
            Possible Conditions
          </h3>
          <div className="space-y-3">
            {result.possibleConditions.map((c, i) => (
              <div
                key={i}
                className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${LIKELIHOOD_BADGE[c.likelihood] || LIKELIHOOD_BADGE.low}`}>
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
      {result.recommendedSpecialties?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
            Recommended Specialties
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.recommendedSpecialties.map((s, i) => (
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

      {/* General advice */}
      {result.generalAdvice && (
        <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">General Advice</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{result.generalAdvice}</p>
        </div>
      )}

      {/* Disclaimer */}
      {result.disclaimer && (
        <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3 leading-relaxed">
          ⚕ {result.disclaimer}
        </p>
      )}

      {/* New check button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium
                     text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          Check Another Symptom
        </button>
      )}
    </div>
  );
};

// ── HistoryItem ────────────────────────────────────────────────────────────────
const HistoryItem = ({ item, onDelete, onView }) => {
  const urgency = URGENCY[item.urgencyLevel] || URGENCY.routine;
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${urgency.badge}`}>
              {urgency.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{item.symptoms}</p>
          {item.possibleConditions?.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {item.possibleConditions.slice(0, 2).map((c) => c.name).join(', ')}
              {item.possibleConditions.length > 2 && ` +${item.possibleConditions.length - 2} more`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onView(item)}
            className="p-1.5 rounded text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
            title="View"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SymptomChecker = () => {
  const [symptoms, setSymptoms]     = useState('');
  const [age, setAge]               = useState('');
  const [gender, setGender]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');

  const [history, setHistory]       = useState([]);
  const [histLoading, setHistLoading]= useState(true);
  const [activeTab, setActiveTab]   = useState('checker'); // 'checker' | 'history'
  const [viewItem, setViewItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  // Load history on mount
  useEffect(() => {
    aiAPI.getHistory()
      .then(({ data }) => setHistory(data.data || []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await aiAPI.checkSymptoms({
        symptoms: symptoms.trim(),
        age:    age    ? Number(age)  : undefined,
        gender: gender || undefined,
      });
      setResult(data.data);

      // Prepend to local history
      if (data.data?.id) {
        setHistory((prev) => [{
          _id:                  data.data.id,
          symptoms:             symptoms.trim(),
          urgencyLevel:         data.data.urgencyLevel,
          possibleConditions:   data.data.possibleConditions,
          generalAdvice:        data.data.generalAdvice,
          recommendedSpecialties: data.data.recommendedSpecialties,
          disclaimer:           data.data.disclaimer,
          createdAt:            new Date().toISOString(),
          symptomsAnalyzed:     data.data.symptomsAnalyzed,
        }, ...prev]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) return;
    setDeletingId(deleteTarget._id);
    try {
      await aiAPI.deleteCheck(deleteTarget._id);
      setHistory((prev) => prev.filter((h) => h._id !== deleteTarget._id));
      if (viewItem?._id === deleteTarget._id) setViewItem(null);
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeletingId('');
    }
  };

  const handleReset = () => {
    setResult(null);
    setSymptoms('');
    setAge('');
    setGender('');
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Symptom Checker</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Powered by GitHub AI · gpt-4o-mini</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          Describe your symptoms and get preliminary health suggestions and recommended doctor specialties.
          This tool does not replace professional medical advice.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1 mb-6">
        {[
          { key: 'checker', label: 'Symptom Checker' },
          { key: 'history', label: `History (${history.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setViewItem(null); }}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition
              ${activeTab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Checker Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'checker' && (
        <div>
          {result ? (
            <ResultCard result={result} onClose={handleReset} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Symptoms textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Describe your symptoms <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. I have a persistent headache for 2 days, mild fever, sore throat and fatigue..."
                  rows={5}
                  required
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             resize-none text-sm transition"
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Be as specific as possible — include duration, severity, and any related symptoms.
                </p>
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Age <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               placeholder:text-gray-400 dark:placeholder:text-gray-500
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                               text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Gender <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                               text-sm transition appearance-none"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-4 py-3">
                  <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !symptoms.trim()}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                           text-white font-semibold rounded-md transition flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
                    Analyzing symptoms...
                  </>
                ) : (
                  <>
                    <FiZap className="w-4 h-4" />
                    Analyze Symptoms
                  </>
                )}
              </button>

              {/* Disclaimer note */}
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                ⚕ For informational purposes only. Not a substitute for professional medical advice.
              </p>
            </form>
          )}
        </div>
      )}

      {/* ── View Modal ───────────────────────────────────────────────────────── */}
      <SymptomModal item={viewItem} onClose={() => setViewItem(null)} />

      {deleteTarget && (
        <DeleteConfirmModal
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deletingId === deleteTarget._id}
          title="Delete symptom check?"
          message="This symptom check will be permanently deleted from your history. This action cannot be undone."
          confirmText="Delete"
          cancelText="Keep"
        />
      )}

      {/* ── History Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div>
          {histLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <FiZap className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No symptom checks yet</p>
              <p className="text-xs mt-1">Your analysis history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <HistoryItem
                  key={item._id}
                  item={item}
                  onDelete={setDeleteTarget}
                  onView={setViewItem}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
