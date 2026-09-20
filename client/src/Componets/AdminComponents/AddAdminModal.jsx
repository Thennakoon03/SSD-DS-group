import { useState } from 'react';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

const AddAdminModal = ({ onClose, onSave, loading, error }) => {
	useLockBodyScroll();
	const [form, setForm] = useState({ name: '', email: '', password: '' });

	const handleChange = (e) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave(form);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
			<div
				className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Add New Admin</h3>

				<form onSubmit={handleSubmit} className="space-y-3.5">
					<div>
						<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
						<input
							name="name"
							type="text"
							required
							value={form.name}
							onChange={handleChange}
							placeholder="Admin name"
							className="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
						<input
							name="email"
							type="email"
							required
							value={form.email}
							onChange={handleChange}
							placeholder="admin@example.com"
							className="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
						<input
							name="password"
							type="password"
							required
							minLength={8}
							value={form.password}
							onChange={handleChange}
							placeholder="Minimum 8 characters"
							className="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
							{error}
						</div>
					)}

					<div className="flex gap-2 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Adding...' : 'Add Admin'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddAdminModal;
