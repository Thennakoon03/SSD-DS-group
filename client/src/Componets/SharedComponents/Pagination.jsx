const Pagination = ({
	page,
	totalPages,
	totalItems,
	onPageChange,
	label = 'item',
	pageSize = 5,
}) => {
	const safeTotalPages = Math.max(1, totalPages || 1);
	const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
	const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);
	const groupStart = Math.floor((page - 1) / 5) * 5 + 1;
	const groupEnd = Math.min(groupStart + 4, safeTotalPages);
	const visiblePages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);

	return (
		<div className="px-5 py-3 mt-4 md:mt-0 bg-white dark:bg-gray-900 rounded-lg md:rounded-none border border-gray-200 dark:border-gray-800 md:border-0 md:border-t flex items-center justify-between gap-4 shadow-sm md:shadow-none">
			<p className="text-xs text-gray-400 dark:text-gray-500">
				{start === 0 ? '0' : `${start}-${end}`} of {totalItems} {label}
				{totalItems !== 1 ? 's' : ''}
			</p>

			<div className="flex items-center gap-1">
				<button
					onClick={() => onPageChange(Math.max(1, page - 1))}
					disabled={page === 1}
					className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
				>
					← Prev
				</button>

				<div className="flex items-center gap-1">
					{visiblePages.map((n) => (
						<button
							key={n}
							onClick={() => onPageChange(n)}
							className={`w-8 h-8 text-xs font-medium rounded-md border transition ${
								n === page
									? 'border-indigo-600 bg-indigo-600 text-white'
									: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
							}`}
						>
							{n}
						</button>
					))}
				</div>

				<button
					onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
					disabled={page === safeTotalPages}
					className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
				>
					Next →
				</button>
			</div>
		</div>
	);
};

export default Pagination;
