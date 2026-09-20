import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { FiSearch, FiX } from 'react-icons/fi';
import Pagination from '../../Componets/SharedComponents/Pagination';

const PAGE_SIZE = 5;

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  completed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  failed:    'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  refunded:  'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const TABS = ['All', 'pending', 'completed', 'refunded', 'failed', 'cancelled'];

function Badge({ label, style }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatLkr(amountLkr = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
  }).format(Number(amountLkr || 0));
}

function getAmountLkr(payment) {
  if (typeof payment?.amountLkr === 'number' && payment.amountLkr > 0) return payment.amountLkr;
  if ((payment?.currency || '').toLowerCase() === 'lkr') return Number(payment.amount || 0) / 100;
  return 0;
}

export default function ManagePayments() {
  const [payments, setPayments]   = useState([]);
  const [apptMap, setApptMap]     = useState({});
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage]           = useState(1);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, apptRes] = await Promise.all([
        adminAPI.getAllPayments(),
        adminAPI.getAllAppointments(),
      ]);
      setPayments(payRes.data?.data || payRes.data?.payments || []);
      const map = {};
      (apptRes.data?.data || []).forEach((a) => {
        map[a._id] = { patientName: a.patientName || '', doctorName: a.doctorName || '' };
      });
      setApptMap(map);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    let list = payments;
    if (activeTab !== 'All') list = list.filter((p) => p.status === activeTab);
    if (q)
      list = list.filter(
        (p) => {
          const appt = apptMap[p.appointmentId] || {};
          return (
            (appt.patientName          || '').toLowerCase().includes(q) ||
            (appt.doctorName           || '').toLowerCase().includes(q) ||
            (p.itemName                || '').toLowerCase().includes(q) ||
            (p.stripePaymentIntentId   || '').toLowerCase().includes(q)
          );
        }
      );
    setFiltered(list);
    setPage(1);
  }, [payments, activeTab, search]);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? payments.length : payments.filter((p) => p.status === t).length;
    return acc;
  }, {});

  const totalRevenueLkr = payments
    .filter((p) => p.status === 'completed' && p.status !== 'refunded')
    .reduce((sum, p) => sum + getAmountLkr(p), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            All payment transactions across the platform
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 order-2 sm:order-1">
            <div className="text-left sm:text-right hidden sm:block">
              <p className="text-xs text-gray-400 dark:text-gray-500">Total Revenue</p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                {formatLkr(totalRevenueLkr)}
              </p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, doctor, intent… "
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Revenue Display */}
          <div className="sm:hidden flex w-full justify-between items-center bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-100 dark:border-green-900/20 order-1">
             <p className="text-sm text-green-700 dark:text-green-400 font-medium">Total Revenue</p>
             <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatLkr(totalRevenueLkr)}</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 mb-6 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-nowrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'All' ? 'All' : tab}
            {counts[tab] > 0 && (
              <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {activeTab !== 'All' && <span className="text-indigo-500 dark:text-indigo-400"> · {activeTab}</span>}
        </p>
      </div>

      {/* Card Wrapper */}
      <div className="md:bg-white md:dark:bg-gray-900 md:border border-gray-200 dark:border-gray-800 md:rounded-md md:overflow-hidden">
        {/* Table */}
        <div className="overflow-hidden md:overflow-x-auto">
          <table className="w-full text-sm block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-left border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0 md:divide-y divide-gray-100 dark:divide-gray-800 pt-4 md:pt-0">
              {loading ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={6} className="block md:table-cell px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-sm">Loading transactions…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none">
                  <td colSpan={6} className="block md:table-cell px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p._id} className="block md:table-row bg-white dark:bg-gray-900 rounded-lg shadow-sm md:shadow-none border border-gray-200 dark:border-gray-800 md:border-none hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition p-2 md:p-0 md:border-b md:border-gray-100 dark:md:border-gray-800">
                    {/* Patient */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</span>
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-right md:text-left">
                        {apptMap[p.appointmentId]?.patientName || <span className="text-gray-400">—</span>}
                      </p>
                    </td>
                    {/* Item */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</span>
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-right md:text-left">{p.itemName || 'Consultation Fee'}</p>
                    </td>
                    {/* Amount */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 whitespace-nowrap border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-right md:text-left">{formatLkr(getAmountLkr(p))}</span>
                    </td>
                    {/* Method */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 capitalize text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</span>
                      <span className="text-right md:text-left">{p.stripePaymentMethod || '—'}</span>
                    </td>
                    {/* Status */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 border-b border-gray-100 dark:border-gray-800 md:border-none">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
                      <Badge label={p.status} style={`${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'} text-right md:text-left`} />
                    </td>
                    {/* Date */}
                    <td className="md:table-cell flex justify-between items-center px-4 md:px-5 py-3 md:py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <span className="md:hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</span>
                      <span className="text-right md:text-left">{formatDate(p.createdAt)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
          label="transaction"
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
