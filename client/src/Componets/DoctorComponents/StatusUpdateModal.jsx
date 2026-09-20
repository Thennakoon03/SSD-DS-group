import { useState } from 'react';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

const StatusUpdateModal = ({ current, onClose, onSave, loading }) => {
	useLockBodyScroll();
	const [status, setStatus] = useState(current === 'pending' ? 'confirmed' : 'completed');
	const [notes, setNotes] = useState('');

	const options = [
		{ value: 'confirmed', label: 'Confirm', desc: 'Accept this appointment' },
		{ value: 'completed', label: 'Complete', desc: 'Mark as seen/done' },
		{ value: 'no_show', label: 'No-show', desc: 'Patient did not attend' },
	].filter((o) => {
		if (current === 'pending') return o.value !== 'completed';
		if (current === 'confirmed') return o.value !== 'confirmed';
		return false;
	});

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
			<div
				className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Update Appointment Status</h3>

				<div className="space-y-2 mb-4">
					{options.map((o) => (
						<label
							key={o.value}
							className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition
								${status === o.value
									? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
									: 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
								}`}
						>
							<input
								type="radio"
								name="status"
								value={o.value}
								checked={status === o.value}
								onChange={() => setStatus(o.value)}
								className="accent-indigo-600"
							/>
							<div>
								<p className="text-sm font-medium text-gray-800 dark:text-gray-200">{o.label}</p>
								<p className="text-xs text-gray-400 dark:text-gray-500">{o.desc}</p>
							</div>
						</label>
					))}
				</div>

				<div className="mb-5">
					<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
						Notes <span className="text-gray-400 font-normal">(optional)</span>
					</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={3}
						placeholder="Add clinical notes or follow-up instructions..."
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
						onClick={() => onSave(status, notes)}
						disabled={loading}
						className="flex-1 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
											 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default StatusUpdateModal;
