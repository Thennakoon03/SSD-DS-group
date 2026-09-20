import { useRef, useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

const PrescriptionModal = ({ onClose, onSave, loading }) => {
	useLockBodyScroll();
	const fileRef  = useRef(null);
	const [file, setFile] = useState(null);
	const [notes, setNotes] = useState('');
	const [error, setError] = useState('');

	const handleFile = (e) => {
		const f = e.target.files[0];
		if (!f) return;

		const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
		if (!allowed.includes(f.type)) {
			setError('Only JPG, PNG, WEBP, or PDF files are allowed.');
			return;
		}
		if (f.size > 10 * 1024 * 1024) {
			setError('File must be under 10 MB.');
			return;
		}

		setError('');
		setFile(f);
	};

	const handleSave = () => {
		if (!file) {
			setError('Please select a file.');
			return;
		}

		const fd = new FormData();
		fd.append('prescription', file);
		if (notes.trim()) fd.append('notes', notes.trim());
		onSave(fd);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
			<div
				className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Upload Prescription</h3>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Accepts JPG, PNG, WEBP, or PDF - max 10 MB.</p>

				<div
					onClick={() => fileRef.current?.click()}
					className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 mb-3 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition"
				>
					<FiUpload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
					<p className="text-sm text-gray-500 dark:text-gray-400">{file ? file.name : 'Click to select file'}</p>
					<input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleFile} />
				</div>

				{error && <p className="text-xs text-red-600 mb-3">{error}</p>}

				<div className="mb-5">
					<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
						Notes <span className="text-gray-400 font-normal">(optional)</span>
					</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={3}
						placeholder="Dosage instructions, follow-up notes..."
						className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600
											 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
											 placeholder:text-gray-400 dark:placeholder:text-gray-500
											 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
					/>
				</div>

				<div className="flex gap-2">
					<button
						onClick={onClose}
						className="flex-1 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium
											 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={loading}
						className="flex-1 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
											 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Uploading...' : 'Upload'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default PrescriptionModal;
