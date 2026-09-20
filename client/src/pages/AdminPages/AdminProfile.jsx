import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../Context/AuthContext';
import { toast } from 'react-hot-toast';

const AdminProfile = () => {
	const { updateUser } = useAuth();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [form, setForm] = useState({
		name: '',
		email: '',
	});
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	useEffect(() => {
		const loadProfile = async () => {
			setLoading(true);
			try {
				const res = await adminAPI.getProfile();
				const data = res.data?.data;
				setForm({
					name: data?.name || '',
					email: data?.email || '',
				});
			} catch {
				toast.error('Failed to load profile details.');
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, []);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.name.trim()) {
			toast.error('Name is required.');
			return;
		}

		setSaving(true);
		try {
			const payload = { name: form.name.trim() };
			const res = await adminAPI.updateProfile(payload);
			const updated = res.data?.data;

			updateUser({
				name: updated?.name || payload.name,
				email: updated?.email || form.email,
			});

			toast.success('Profile updated successfully.');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to update profile.');
		} finally {
			setSaving(false);
		}
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();

		if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
			toast.error('Please fill all password fields.');
			return;
		}

		if (passwordForm.newPassword.length < 8) {
			toast.error('New password must be at least 8 characters.');
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error('New password and confirm password do not match.');
			return;
		}

		setSavingPassword(true);
		try {
			await adminAPI.changePassword({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword,
			});
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
			toast.success('Password changed successfully.');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to change password.');
		} finally {
			setSavingPassword(false);
		}
	};

	if (loading) {
		return (
			<div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center min-h-[40vh]">
				<div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Profile</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your basic account information.</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5 sm:p-6 space-y-5"
			>
				<div>
					<label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
						Full Name
					</label>
					<input
						name="name"
						value={form.name}
						onChange={handleChange}
						type="text"
						placeholder="Admin name"
						className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
						Email Address
					</label>
					<input
						name="email"
						value={form.email}
						type="email"
						disabled
						className="w-full px-3.5 py-2.5 rounded-md bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
					/>
				</div>

				<div className="pt-1 flex justify-end">
					<button
						type="submit"
						disabled={saving}
						className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>

			<form
				onSubmit={handlePasswordSubmit}
				className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5 sm:p-6 space-y-5"
			>
				<div>
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Use at least 8 characters for your new password.</p>
				</div>

				<div>
					<label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
						Current Password
					</label>
					<input
						value={passwordForm.currentPassword}
						onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
						type="password"
						placeholder="Current password"
						className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div className="grid sm:grid-cols-2 gap-4">
					<div>
						<label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
							New Password
						</label>
						<input
							value={passwordForm.newPassword}
							onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
							type="password"
							placeholder="Minimum 8 characters"
							className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
					<div>
						<label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
							Confirm Password
						</label>
						<input
							value={passwordForm.confirmPassword}
							onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
							type="password"
							placeholder="Repeat new password"
							className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
				</div>

				<div className="pt-1 flex justify-end">
					<button
						type="submit"
						disabled={savingPassword}
						className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{savingPassword ? 'Updating...' : 'Update Password'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default AdminProfile;
