import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { doctorAPI, appointmentAPI, paymentAPI } from '../../utils/api';
import { STATUS_CONFIG, formatDate, formatTime, isToday, isUpcoming } from '../../Componets/DoctorComponents/AppointmentCard';
import {
  FiCalendar, FiClock, FiCheckCircle, FiDollarSign,
  FiArrowRight, FiToggleLeft, FiToggleRight, FiUser,
  FiVideo, FiHome, FiAlertCircle,
} from 'react-icons/fi';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── component ───────────────────────────────────────────────────────────── */
const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile,      setProfile]      = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [toggling,     setToggling]     = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, apptRes, paymentsRes] = await Promise.all([
          doctorAPI.getProfile(),
          appointmentAPI.getDoctorMine(),
          paymentAPI.getDoctorPayments(),
        ]);
        setProfile(profileRes.data?.data || profileRes.data || null);
        setAppointments(apptRes.data?.data || apptRes.data || []);
        setPayments(paymentsRes.data?.data || paymentsRes.data || []);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* toggle availability */
  const handleToggleAvailability = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await doctorAPI.toggleAvailability();
      const updated = res.data?.data || res.data;
      setProfile((prev) => ({ ...prev, isAvailable: updated?.isAvailable ?? !prev?.isAvailable }));
    } catch {
      /* silently ignore */
    } finally {
      setToggling(false);
    }
  };

  /* derived */
  const todayAppts = appointments
    .filter((a) => isToday(a.appointmentDate) && isUpcoming(a))
    .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));

  const pendingCount   = appointments.filter((a) => a.status === 'pending').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalEarnings  = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amountLkr || 0), 0);

  const firstName =
    profile?.firstName || user?.firstName || user?.name?.split(' ')[0] || 'Doctor';

  /* upcoming (non-today) next 4 */
  const upcomingAppts = appointments
    .filter((a) => isUpcoming(a) && !isToday(a.appointmentDate))
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    .slice(0, 4);

  /* ── loading / error ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">
          {error}
        </div>
      </div>
    );
  }

  /* ── stat cards ───────────────────────────────────────────────────────── */
  const statCards = [
    {
      label: "Today's Appointments",
      value: todayAppts.length,
      icon: <FiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      to: '/doctor/appointments',
      highlight: todayAppts.length > 0,
    },
    {
      label: 'Pending Requests',
      value: pendingCount,
      icon: <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      to: '/doctor/appointments',
      highlight: pendingCount > 0,
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
      bg: 'bg-green-50 dark:bg-green-900/20',
      to: '/doctor/appointments',
    },
    {
      label: 'Total Earnings',
      value: `LKR ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <FiDollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      to: null,
    },
  ];

  /* ── quick actions ────────────────────────────────────────────────────── */
  const quickActions = [
    {
      label: 'View All Appointments',
      desc: 'Manage, confirm or cancel your appointments.',
      path: '/doctor/appointments',
      icon: <FiCalendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      label: 'My Profile',
      desc: 'Update your specialization, bio and availability.',
      path: '/doctor/profile',
      icon: <FiUser className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    },
  ];

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {greeting()}, Dr. {firstName} !
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {todayAppts.length > 0
              ? `You have ${todayAppts.length} appointment${todayAppts.length > 1 ? 's' : ''} today.`
              : 'No appointments scheduled for today.'}
          </p>
        </div>

        {/* Availability toggle */}
        <button
          onClick={handleToggleAvailability}
          disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-colors disabled:opacity-60 ${
            profile?.isAvailable
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {profile?.isAvailable
            ? <FiToggleRight className="w-4 h-4" />
            : <FiToggleLeft className="w-4 h-4" />}
          {profile?.isAvailable ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ label, value, icon, bg, to, highlight }) => (
          <button
            key={label}
            onClick={() => to && navigate(to)}
            className={`text-left p-4 rounded-md border transition hover:shadow-sm ${
              highlight
                ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            } ${to ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 ${bg}`}>
              {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Today's schedule */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Today's Schedule</h2>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all →
            </button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="py-8 text-center">
              <FiCalendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No appointments today.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {todayAppts.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                return (
                  <button
                    key={appt._id}
                    onClick={() => navigate(`/doctor/appointments/${appt._id}`)}
                    className="w-full flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {appt.patientProfileImage ? (
                        <img src={appt.patientProfileImage} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
                          {appt.patientName?.[0] || 'P'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {appt.patientName || 'Patient'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <FiClock className="w-3 h-3" />
                          {formatTime(appt.appointmentTime)}
                          {appt.type === 'telemedicine'
                            ? <><FiVideo className="w-3 h-3 ml-1" /> Telemedicine</>
                            : <><FiHome className="w-3 h-3 ml-1" /> In-Person</>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <FiArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: upcoming + quick actions */}
        <div className="flex flex-col gap-5">

          {/* Upcoming (non-today) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming</h2>
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all →
              </button>
            </div>

            {upcomingAppts.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No upcoming appointments.</p>
            ) : (
              <div className="space-y-1">
                {upcomingAppts.map((appt) => {
                  const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                  return (
                    <button
                      key={appt._id}
                      onClick={() => navigate(`/doctor/appointments/${appt._id}`)}
                      className="w-full flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {appt.patientName || 'Patient'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <FiCalendar className="w-3 h-3" />
                          {formatDate(appt.appointmentDate)}
                        </p>
                      </div>
                      <span className={`shrink-0 ml-3 text-[11px] font-semibold px-2 py-0.5 rounded border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map(({ label, desc, path, icon }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-md border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition group"
                >
                  <div className="w-8 h-8 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{desc}</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
