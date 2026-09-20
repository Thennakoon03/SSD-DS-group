import { useState } from 'react';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

const NotesModal = ({ initial, onClose, onSave, loading }) => {
	useLockBodyScroll();
	const [notes, setNotes] = useState(initial || '');

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
			<div
				className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Clinical Notes</h3>
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={6}
					placeholder="Add clinical notes, observations, or follow-up instructions..."
					className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600
										 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
										 placeholder:text-gray-400 dark:placeholder:text-gray-500
										 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
										 resize-none mb-4"
				/>
				<div className="flex gap-2">
					<button
						onClick={onClose}
						className="flex-1 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium
											 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
					>
						Cancel
					</button>
					<button
						onClick={() => onSave(notes)}
						disabled={loading || !notes.trim()}
						className="flex-1 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
											 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Saving...' : 'Save Notes'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default NotesModal;
