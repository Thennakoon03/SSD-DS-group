import { FiFileText, FiFile, FiClipboard, FiImage, FiBarChart2, FiExternalLink, FiEdit2, FiTrash2 } from 'react-icons/fi';

// ── Config ────────────────────────────────────────────────────────────────────
export const REPORT_TYPES = [
  { value: 'lab_report',         label: 'Lab Report' },
  { value: 'prescription',       label: 'Prescription' },
  { value: 'scan',               label: 'Scan / Imaging' },
  { value: 'discharge_summary',  label: 'Discharge Summary' },
  { value: 'other',              label: 'Other' },
];

export const TYPE_COLORS = {
  lab_report:        'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  prescription:      'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  scan:              'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  discharge_summary: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  other:             'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
};

export const TYPE_ICONS = {
  lab_report:        FiFileText,
  prescription:      FiClipboard,
  scan:              FiImage,
  discharge_summary: FiBarChart2,
  other:             FiFile,
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const isImage = (fmt) => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes((fmt || '').toLowerCase());

// ── Report card ───────────────────────────────────────────────────────────────
const ReportCard = ({ report, onEdit, onDelete }) => {
  const typeMeta  = REPORT_TYPES.find((t) => t.value === report.reportType) || REPORT_TYPES[4];
  const colorCls  = TYPE_COLORS[report.reportType] || TYPE_COLORS.other;
  const TypeIcon  = TYPE_ICONS[report.reportType] || TYPE_ICONS.other;
  const imgFile   = isImage(report.fileFormat);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 flex gap-4">
      {/* Thumbnail / icon */}
      <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {imgFile ? (
          <img src={report.fileUrl} alt={report.title} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{report.title}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${colorCls}`}>
                {typeMeta.label}
              </span>
              {report.fileFormat && (
                <span className="text-[11px] uppercase font-medium text-gray-400 dark:text-gray-500">
                  {report.fileFormat}
                </span>
              )}
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
              title="View report"
              aria-label="View report"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => onEdit(report)}
              className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Edit report"
              aria-label="Edit report"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(report)}
              className="p-1 rounded text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title="Delete report"
              aria-label="Delete report"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {report.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{report.description}</p>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
