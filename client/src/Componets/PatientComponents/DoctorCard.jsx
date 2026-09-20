import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase();

  return (
    <div
      onClick={() => navigate(`/patient/doctors/${doctor._id}`)}
      className="flex flex-col items-center text-center gap-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-md px-4 py-6 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group relative shadow-sm"
    >
      {/* Availability badge */}
      {doctor.isAvailable && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs text-green-600 font-medium">
          <FiCheckCircle className="w-3 h-3" />
          Available
        </span>
      )}

      {/* Avatar */}
      <div className="shrink-0">
        {doctor.profileImage ? (
          <img src={doctor.profileImage} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center ring-2 ring-indigo-100 dark:ring-indigo-900">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="w-full min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-2">
          Dr. {doctor.firstName} {doctor.lastName}
        </h3>

        {/* Specializations */}
        {doctor.specialization?.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-center mb-2">
            {doctor.specialization.slice(0, 2).map((s, i) => (
              <span key={i} className="text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
            {doctor.specialization.length > 2 && (
              <span className="text-xs text-gray-400">+{doctor.specialization.length - 2}</span>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
          {doctor.experience > 0 && (
            <span>{doctor.experience} yr{doctor.experience !== 1 ? 's' : ''} exp</span>
          )}
          {doctor.consultationFee > 0 && (
            <span>LKR {doctor.consultationFee.toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* View profile hint */}
      <div className="w-full mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-1">
        <span className="text-xs font-medium text-indigo-500 group-hover:text-indigo-600 transition-colors">
          View Profile
        </span>
        <FiArrowRight className="w-3 h-3 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
      </div>
    </div>
  );
};

export default DoctorCard;
