import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { patientAPI, appointmentAPI, reportAPI, paymentAPI } from '../../utils/api';
import {
  FiCalendar, FiFileText, FiDollarSign, FiActivity,
  FiClock, FiCheckCircle, FiXCircle, FiArrowRight,
  FiUsers, FiZap,
} from 'react-icons/fi';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const STATUS_STYLE = {
  pending:       'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
  confirmed:     'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
  completed:     'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
  cancelled:     'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  no_show:       'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
  not_responded: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
};

const STATUS_ICON = {
  pending:       <FiClock className="w-3.5 h-3.5" />,
  confirmed:     <FiCheckCircle className="w-3.5 h-3.5" />,
  completed:     <FiCheckCircle className="w-3.5 h-3.5" />,
  cancelled:     <FiXCircle className="w-3.5 h-3.5" />,
  no_show:       <FiXCircle className="w-3.5 h-3.5" />,
  not_responded: <FiClock className="w-3.5 h-3.5" />,
};

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const appointmentDateTime = (appt) => {
  const date = appt?.appointmentDate;
  const time = appt?.appointmentTime || '00:00';
  if (!date) return Number.POSITIVE_INFINITY;

  const dt = new Date(`${date}T${time}:00`);
  if (!Number.isNaN(dt.getTime())) return dt.getTime();

  const fallback = new Date(date);
  return Number.isNaN(fallback.getTime()) ? Number.POSITIVE_INFINITY : fallback.getTime();
};

/* ── component ───────────────────────────────────────────────────────────── */
const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile,      setProfile]      = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports,      setReports]      = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, apptRes, reportsRes, paymentsRes] = await Promise.all([
          patientAPI.getProfile(),
          appointmentAPI.getMine(),
          reportAPI.getMine(),
          paymentAPI.getMine(),
        ]);
        setProfile(profileRes.data?.data || profileRes.data || null);
        setAppointments(apptRes.data?.data || apptRes.data || []);
        setReports(reportsRes.data?.data || reportsRes.data || []);
        setPayments(paymentsRes.data?.data || paymentsRes.data || []);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* derived */
  const upcoming = appointments
    .filter((a) => ['pending', 'confirmed'].includes(a.status))
    .sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b))
    .slice(0, 5);

  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amountLkr || 0), 0);

  const firstName =
    profile?.firstName || user?.firstName || user?.name?.split(' ')[0] || 'there';

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
      label: 'Upcoming',
      value: upcoming.length,
      icon: <FiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      to: '/patient/appointments',
    },
    {
      label: 'Total Appointments',
      value: appointments.length,
      icon: <FiActivity className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      to: '/patient/appointments',
    },
    {
      label: 'My Reports',
      value: reports.length,
      icon: <FiFileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      to: '/patient/reports',
    },
    {
      label: 'Total Paid',
      value: `LKR ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />,
      bg: 'bg-green-50 dark:bg-green-900/20',
      to: null,
    },
  ];

  /* ── quick actions ────────────────────────────────────────────────────── */
  const quickActions = [
    {
      label: 'Find a Doctor',
      desc: 'Browse verified specialists and book an appointment.',
      path: '/patient/doctors',
      icon: <FiUsers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      label: 'My Appointments',
      desc: 'View, manage or cancel your appointments.',
      path: '/patient/appointments',
      icon: <FiCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: 'Symptom Checker',
      desc: 'Describe symptoms and get AI-powered insights.',
      path: '/patient/symptom-checker',
      icon: <FiZap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
    },
    {
      label: 'My Reports',
      desc: 'Upload and view your medical lab reports.',
      path: '/patient/reports',
      icon: <FiFileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    },
  ];

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {greeting()}, {firstName}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your health today.
          </p>
        </div>
        <button
          onClick={() => navigate('/patient/doctors')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <FiCalendar className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ label, value, icon, bg, to }) => (
          <button
            key={label}
            onClick={() => to && navigate(to)}
            className={`text-left p-4 rounded-md border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 transition hover:shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 ${to ? 'cursor-pointer' : 'cursor-default'}`}
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

        {/* Upcoming appointments */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming Appointments</h2>
            <button
              onClick={() => navigate('/patient/appointments')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all →
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="py-8 text-center">
              <FiCalendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No upcoming appointments.</p>
              <button
                onClick={() => navigate('/patient/doctors')}
                className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Book one now →
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {upcoming.map((appt) => {
                const status = appt.status?.toLowerCase() || 'pending';
                return (
                  <button
                    key={appt._id}
                    onClick={() => navigate(`/patient/appointments/${appt._id}`)}
                    className="w-full flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {appt.doctorProfileImage ? (
                        <img
                          src={appt.doctorProfileImage}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
                          {appt.doctorName?.[0] || 'D'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {appt.doctorName ? `Dr. ${appt.doctorName}` : 'Doctor'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <FiCalendar className="w-3 h-3" />
                          {fmt(appt.appointmentDate)}
                          {appt.appointmentTime && <> · {appt.appointmentTime}</>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
                        {STATUS_ICON[status]}
                        {(status.charAt(0).toUpperCase() + status.slice(1)).replace('_', ' ')}
                      </span>
                      <FiArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                    </div>
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
  );
};

export default PatientDashboard;
