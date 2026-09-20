import { useEffect, useRef, useState } from 'react';
import { FiCheckCircle, FiUploadCloud, FiX } from 'react-icons/fi';
import { REPORT_TYPES } from './ReportCard';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

const EditReportModal = ({ report, editing, onClose, onSave }) => {
  useLockBodyScroll();
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('lab_report');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (!report) return;
    setTitle(report.title || '');
    setReportType(report.reportType || 'lab_report');
    setDescription(report.description || '');
    setFile(null);
    setError('');
  }, [report]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setError('');
    try {
      const payload = new FormData();
      payload.append('title', title.trim());
      payload.append('reportType', reportType);
      if (description.trim()) payload.append('description', description.trim());
      if (file) payload.append('file', file);
      await onSave(payload);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            aria-label="Close edit report modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Replace File <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition
                ${
                  file
                    ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600'
                }`}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setError('');
                }}
              />

              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium truncate max-w-56">
                    {file.name}
                  </span>
                </div>
              ) : (
                <>
                  <FiUploadCloud className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click to choose a new file, or keep current file</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blood Test Results"
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-sm text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Description <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes about this report..."
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={editing}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition"
            >
              {editing ? (
                <>
                  <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReportModal;
