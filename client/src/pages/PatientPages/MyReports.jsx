import { useState, useEffect } from 'react';
import { reportAPI } from '../../utils/api';
import { FiPlus, FiFileText } from 'react-icons/fi';
import ReportCard, { REPORT_TYPES } from '../../Componets/PatientComponents/ReportCard';
import AddLabReportModal from '../../Componets/PatientComponents/AddLabReportModal';
import EditReportModal from '../../Componets/PatientComponents/EditReportModal';
import DeleteConfirmModal from '../../Componets/SharedComponents/DeleteConfirmModal';

// ── Main page ─────────────────────────────────────────────────────────────────
const MyReports = () => {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showUpload, setShowUpload]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [editing, setEditing]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [filter, setFilter]           = useState('all');

  useEffect(() => {
    reportAPI.getMine()
      .then(({ data }) => setReports(data.data || []))
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUploaded = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
    setShowUpload(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reportAPI.delete(deleteTarget._id);
      setReports((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // keep modal open so user can retry
    } finally {
      setDeleting(false);
    }
  };

  const handleEditConfirm = async (payload) => {
    if (!editTarget) return;
    setEditing(true);
    try {
      const { data } = await reportAPI.update(editTarget._id, payload);
      const updated = data.data;
      setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setEditTarget(null);
    } finally {
      setEditing(false);
    }
  };

  const filtered = filter === 'all'
    ? reports
    : reports.filter((r) => r.reportType === filter);

  // ── Counts per type ────────────────────────────────────────────────────────
  const counts = REPORT_TYPES.reduce((acc, t) => {
    acc[t.value] = reports.filter((r) => r.reportType === t.value).length;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {reports.length} report{reports.length !== 1 ? 's' : ''} stored
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold rounded-lg transition"
        >
          <FiPlus className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Filter tabs */}
      {reports.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition
              ${filter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
              }`}
          >
            All ({reports.length})
          </button>
          {REPORT_TYPES.filter((t) => counts[t.value] > 0).map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition
                ${filter === t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                }`}
            >
              {t.label} ({counts[t.value]})
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-sm text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiFileText className="w-14 h-14 text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {filter === 'all' ? 'No reports yet' : `No ${REPORT_TYPES.find((t) => t.value === filter)?.label} reports`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Upload your first report →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReportCard key={r._id} report={r} onEdit={setEditTarget} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && <AddLabReportModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
      {editTarget && (
        <EditReportModal
          report={editTarget}
          editing={editing}
          onClose={() => setEditTarget(null)}
          onSave={handleEditConfirm}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          title="Delete report?"
          message={`"${deleteTarget.title}" will be permanently deleted and cannot be recovered.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default MyReports;
