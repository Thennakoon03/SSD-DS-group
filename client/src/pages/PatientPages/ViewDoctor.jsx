import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../utils/api';
import { FiChevronLeft, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';

const ViewDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    doctorAPI.getById(id)
      .then((res) => setDoctor(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load doctor details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  );

  if (error || !doctor) return (
    <div className="max-w-sm mx-auto mt-20 text-center px-4">
      <p className="text-gray-800 font-medium mb-1">Doctor not found</p>
      <p className="text-sm text-gray-400 mb-4">{error}</p>
      <button onClick={() => navigate('/patient/doctors')} className="text-sm text-indigo-600 hover:underline">
        ← Back to All Doctors
      </button>
    </div>
  );

  const initials = `${doctor.firstName?.[0] ?? ''}${doctor.lastName?.[0] ?? ''}`.toUpperCase();
  const addressParts = [
    doctor.address?.street,
    doctor.address?.city,
    doctor.address?.state,
    doctor.address?.zipCode,
    doctor.address?.country,
  ].filter(Boolean);
  const appointmentTypes = ['In-Person', 'Telemedicine'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <button
          onClick={() => navigate('/patient/doctors')}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8"
        >
          <FiChevronLeft className="w-4 h-4" />
          All Doctors
        </button>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── Left ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Identity */}
            <div className="flex gap-5 items-start">
              {doctor.profileImage ? (
                <img src={doctor.profileImage} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">{initials}</span>
                </div>
              )}

              <div className="flex-1 min-w-0 pt-0.5">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h1>

                {doctor.specialization?.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {doctor.specialization.join(' · ')}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {doctor.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                      <MdVerified className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                  {doctor.isVerified && doctor.isAvailable && (
                    <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 text-xs ${doctor.isAvailable ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${doctor.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {doctor.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            {(doctor.experience > 0 || doctor.gender || doctor.consultationFee > 0 || doctor.hospital || doctor.licenseNumber) && (
              <div className="flex flex-wrap gap-6">
                {doctor.experience > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Experience</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{doctor.experience} years</p>
                  </div>
                )}
                {doctor.gender && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Gender</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{doctor.gender}</p>
                  </div>
                )}
                {doctor.hospital && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Hospital</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{doctor.hospital}</p>
                  </div>
                )}
                {doctor.licenseNumber && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">License Number</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{doctor.licenseNumber}</p>
                  </div>
                )}
              </div>
            )}

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Description */}
            {doctor.description && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About Doctor</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {doctor.description}
                </p>
              </div>
            )}

            {/* Appointment types */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Appointment Types Offered</h2>
              <div className="flex flex-wrap gap-2">
                {appointmentTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            {doctor.qualifications && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Qualifications</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{doctor.qualifications}</p>
              </div>
            )}

            

            {/* Contact */}
            {(doctor.email || doctor.phone || addressParts.length > 0) && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</h2>
                <div className="space-y-2">
                  {doctor.email && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <FiMail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {doctor.email}
                    </div>
                  )}
                  {doctor.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <FiPhone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {doctor.phone}
                    </div>
                  )}
                  {addressParts.length > 0 && (
                    <div className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      {addressParts.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right — Booking ── */}
          <div className="lg:order-0">
            <div className="border border-gray-200 dark:border-gray-800 rounded-md p-5 lg:sticky lg:top-6">
              {doctor.consultationFee > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400 mb-0.5">Consultation fee</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    LKR {doctor.consultationFee.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full shrink-0 ${doctor.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {doctor.isAvailable ? 'Accepting appointments' : 'Not accepting appointments'}
                </p>
              </div>

              <button
                onClick={() => navigate(`/patient/appointments/book/${doctor._id}`)}
                disabled={!doctor.isAvailable}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-md transition-colors"
              >
                {doctor.isAvailable ? 'Book Appointment' : 'Unavailable'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewDoctor;
