import { useState, useRef } from 'react';
import { reportAPI } from '../../utils/api';
import useLockBodyScroll from '../../utils/useLockBodyScroll';
import { FiX, FiUploadCloud, FiCheckCircle } from 'react-icons/fi';
import { REPORT_TYPES } from './ReportCard';

// ── Add Lab Report Modal ──────────────────────────────────────────────────────
const AddLabReportModal = ({ onClose, onUploaded }) => {
  useLockBodyScroll();
  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [reportType, setType]     = useState('lab_report');
  const [file, setFile]           = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const fileRef                   = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file)         { setError('Please select a file.'); return; }
    if (!title.trim()) { setError('Title is required.');    return; }

    const fd = new FormData();
    fd.append('file',       file);
    fd.append('title',      title.trim());
    fd.append('reportType', reportType);
    if (description.trim()) fd.append('description', description.trim());

    setUploading(true);
    setError('');
    try {
      const { data } = await reportAPI.upload(fd);
      onUploaded(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upload Medical Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* File picker */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              File <span className="text-red-500">*</span>
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
                onChange={(e) => { setFile(e.target.files[0] || null); setError(''); }}
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click to select PDF, JPG, PNG</p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blood Test Results – Jan 2026"
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Report type */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-sm text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Description{' '}
              <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Any notes about this report…"
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700
                       disabled:opacity-60 text-white text-sm font-semibold rounded-md transition"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
                Uploading…
              </>
            ) : (
              <>
                <FiUploadCloud className="w-4 h-4" />
                Upload Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLabReportModal;
