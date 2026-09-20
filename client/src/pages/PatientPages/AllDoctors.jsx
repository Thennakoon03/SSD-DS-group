import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import { doctorAPI } from '../../utils/api';
import DoctorCard from '../../Componets/PatientComponents/DoctorCard';

const SPECIALIZATIONS = [
  'All', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
  'Gastroenterologist', 'Neurologist', 'Obstetrician/Gynecologist',
  'Oncologist', 'Ophthalmologist', 'Orthopedic Surgeon', 'Pediatrician',
  'Psychiatrist', 'Pulmonologist', 'Surgeon', 'Urologist',
  'General Practitioner', 'Emergency Medicine',
];

const AllDoctors = () => {
  const navigate = useNavigate();

  const [doctors, setDoctors]          = useState([]);
  const [filtered, setFiltered]        = useState([]);
  const [loading, setLoading]          = useState(true);
  const [error, setError]              = useState('');
  const [search, setSearch]            = useState('');
  const [activeSpec, setActiveSpec]    = useState('All');

  useEffect(() => {
    doctorAPI.getAll()
      .then((res) => { setDoctors(res.data.data || []); setFiltered(res.data.data || []); })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = doctors;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.specialization?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (activeSpec !== 'All') {
      result = result.filter((d) => d.specialization?.includes(activeSpec));
    }
    setFiltered(result);
  }, [search, activeSpec, doctors]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 mt-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-6">{error}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Find a Doctor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{doctors.length} verified doctors available</p>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialization…"
            className="w-full pl-11 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Specialization dropdown */}
        <div className="relative sm:shrink-0">
          <select
            value={activeSpec}
            onChange={(e) => setActiveSpec(e.target.value)}
            className="appearance-none w-full sm:w-auto h-full pl-4 pr-9 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
          >
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        {activeSpec !== 'All' && <span className="text-indigo-500"> · {activeSpec}</span>}
      </p>

      {/* Doctor list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base font-medium text-gray-500">No doctors found</p>
          <p className="text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllDoctors;

