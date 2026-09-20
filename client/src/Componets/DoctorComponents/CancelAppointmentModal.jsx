import { useState } from 'react';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

const CancelAppointmentModal = ({ onClose, onConfirm, loading }) => {
	useLockBodyScroll();
	const [reason, setReason] = useState('');

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
			<div
				className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Cancel Appointment</h3>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
					The patient will be notified. This action cannot be undone.
				</p>

				<div className="mb-5">
					<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
						Reason <span className="text-gray-400 font-normal">(optional)</span>
					</label>
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={3}
						placeholder="e.g. Doctor unavailable, emergency…"
						className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600
											 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
											 placeholder:text-gray-400 dark:placeholder:text-gray-500
											 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
					/>
				</div>

				<div className="flex gap-2">
					<button
						onClick={onClose}
						className="flex-1 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium
											 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
					>
						Keep Appointment
					</button>
					<button
						onClick={() => onConfirm(reason)}
						disabled={loading}
						className="flex-1 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
											 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Cancelling…' : 'Cancel Appointment'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CancelAppointmentModal;
