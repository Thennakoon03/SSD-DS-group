import useLockBodyScroll from '../../utils/useLockBodyScroll';

const DeleteConfirmModal = ({
	onClose,
	onConfirm,
	loading = false,
	title = 'Delete item?',
	message = 'This action cannot be undone.',
	confirmText = 'Delete',
	cancelText = 'Cancel',
}) => {
	useLockBodyScroll();

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

			<div
				className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{message}</p>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
					>
						{cancelText}
					</button>

					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="flex-1 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Deleting...' : confirmText}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteConfirmModal;
