import { FiX } from 'react-icons/fi';
import useLockBodyScroll from '../../utils/useLockBodyScroll';

const LabelValue = ({ label, value }) => (
	<div>
		<p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
		<p className="text-sm text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
	</div>
);

const ViewDoctorModal = ({ doctor, onClose }) => {
	if (!doctor) return null;
	useLockBodyScroll();

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

			<div
				className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
					title="Close"
				>
					<FiX className="w-4 h-4" />
				</button>

				<div className="flex items-center gap-4 mb-6 pr-8">
					{doctor.profileImage ? (
						<img
							src={doctor.profileImage}
							alt=""
							className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-800"
						/>
					) : (
						<div className="w-16 h-16 rounded-full border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xl font-semibold">
							{doctor.firstName?.[0]?.toUpperCase() || 'D'}
						</div>
					)}
					<div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							Dr. {doctor.firstName} {doctor.lastName}
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
							{Array.isArray(doctor.specialization)
								? doctor.specialization.join(', ')
								: doctor.specialization || '—'}
						</p>
						<p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doctor.email}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Personal Information</p>
						<div className="grid grid-cols-2 gap-4">
							<LabelValue label="First Name" value={doctor.firstName} />
							<LabelValue label="Last Name" value={doctor.lastName} />
							<LabelValue label="Phone" value={doctor.phone} />
							<LabelValue label="Gender" value={doctor.gender} />
							<LabelValue
								label="Date of Birth"
								value={doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toLocaleDateString() : null}
							/>
							<LabelValue label="Available" value={doctor.isAvailable ? 'Yes' : 'No'} />
						</div>
					</div>

					<div className="space-y-4">
						<p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Professional Information</p>
						<div className="grid grid-cols-2 gap-4">
							<LabelValue
								label="Specialization"
								value={Array.isArray(doctor.specialization) ? doctor.specialization.join(', ') : doctor.specialization}
							/>
							<LabelValue
								label="Experience"
								value={doctor.experience !== undefined && doctor.experience !== null ? `${doctor.experience} years` : null}
							/>
							<LabelValue label="License No." value={doctor.licenseNumber} />
							<LabelValue label="Hospital / Clinic" value={doctor.hospital} />
							<LabelValue
								label="Consultation Fee"
								value={doctor.consultationFee != null ? `$${doctor.consultationFee}` : null}
							/>
							<LabelValue label="Verified" value={doctor.isVerified ? 'Yes' : 'No'} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ViewDoctorModal;
