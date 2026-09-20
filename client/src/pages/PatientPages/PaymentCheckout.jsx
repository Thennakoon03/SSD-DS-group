import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentAPI, appointmentAPI } from '../../utils/api';
import { FiLock, FiCheck, FiChevronLeft, FiCreditCard } from 'react-icons/fi';

// ── Stripe singleton (publishable key from .env) ──────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

const formatTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatLkr = (lkr) => `LKR ${Number(lkr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Row = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 text-sm">
    <span className="text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
    <span className="text-gray-900 dark:text-gray-100 font-medium text-right">{value}</span>
  </div>
);

// ── Shared Stripe element style ──────────────────────────────────────────────
const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#111827',
      fontFamily: 'Outfit, ui-sans-serif, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

// Wrapper so each Stripe iframe looks like a normal input box
const StripeField = ({ children, label, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <div className="w-full px-3.5 py-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    focus-within:ring-2 focus-within:ring-indigo-500 transition">
      {children}
    </div>
    {hint && <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">{hint}</p>}
  </div>
);

// ── Stripe card form — must be rendered inside <Elements> ─────────────────────
const StripeForm = ({ appointment, amountLkr, onSuccess }) => {
  const stripe   = useStripe();
  const elements = useElements();

  const [name,     setName]     = useState('');
  const [paying,   setPaying]   = useState(false);
  const [payError, setPayError] = useState('');
  const [rateInfo, setRateInfo] = useState(null); // { amountUsdCents, exchangeRate }

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!name.trim()) { setPayError('Please enter the cardholder name.'); return; }

    setPayError('');
    setPaying(true);

    try {
      // 1. Create PaymentIntent — backend fetches live rate and returns USD cents
      let clientSecret, paymentIntentId, receivedUsdCents, receivedRate;
      try {
        const { data: intentRes } = await paymentAPI.createIntent({
          appointmentId: appointment._id,
          doctorId:      appointment.doctorId,
          amountLkr,
          itemName: `Consultation with Dr. ${appointment.doctorName || 'Doctor'}`,
        });
        clientSecret    = intentRes.data.clientSecret;
        paymentIntentId = intentRes.data.paymentIntentId;
        receivedUsdCents = intentRes.data.amountUsdCents;
        receivedRate     = intentRes.data.exchangeRate;
        setRateInfo({ amountUsdCents: receivedUsdCents, exchangeRate: receivedRate });
      } catch (intentErr) {
        if (intentErr.response?.status === 409) {
          clientSecret    = intentErr.response.data?.data?.clientSecret;
          paymentIntentId = intentErr.response.data?.data?.paymentIntentId;
          if (!clientSecret) {
            setPayError('Payment already initiated. Please refresh the page.');
            return;
          }
        } else {
          throw intentErr;
        }
      }

      // 2. Confirm with Stripe
      const cardNumber = elements.getElement(CardNumberElement);
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: { name: name.trim() },
        },
      });

      if (error) {
        setPayError(error.message);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const markResult = await appointmentAPI.markPaid(appointment._id).catch(e => e);
        if (markResult instanceof Error) {
          await paymentAPI.confirmTest({ paymentIntentId }).catch(() => {});
        } else {
          paymentAPI.confirmTest({ paymentIntentId }).catch(() => {});
        }
        onSuccess(amountLkr);
      } else {
        setPayError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {/* Cardholder name */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          Cardholder Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name on card"
          className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Card Number */}
      <StripeField
        label="Card Number"
        hint={<>Test: <span className="font-mono">4242 4242 4242 4242</span></>}
      >
        <CardNumberElement options={ELEMENT_OPTIONS} />
      </StripeField>

      {/* Expiry + CVC side by side */}
      <div className="grid grid-cols-2 gap-4">
        <StripeField label="Expiry Date" hint="MM / YY">
          <CardExpiryElement options={ELEMENT_OPTIONS} />
        </StripeField>
        <StripeField label="CVC" hint="3-digit code on back">
          <CardCvcElement options={ELEMENT_OPTIONS} />
        </StripeField>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <FiLock className="w-3.5 h-3.5 shrink-0" />
        Payments are encrypted and processed by Stripe
      </div>

      {rateInfo && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          ≈ USD {(rateInfo.amountUsdCents / 100).toFixed(2)} charged to your card
          {' '}(rate: 1 USD = LKR {rateInfo.exchangeRate.toFixed(2)})
        </p>
      )}

      {payError && (
        <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2.5">
          {payError}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700
                   disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-md transition active:scale-95"
      >
        {paying && (
          <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
        )}
        {paying ? 'Processing…' : `Pay ${formatLkr(amountLkr)}`}
      </button>
    </form>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PaymentCheckout = () => {
  const { appointmentId } = useParams();
  const navigate          = useNavigate();
  const location          = useLocation();

  const defaultAmountLkr = location.state?.amountLkr ?? 3500;

  const [appointment, setAppointment] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState('');

  const [paid,       setPaid]       = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [cashMarked, setCashMarked] = useState(false);
  const [cashSaving, setCashSaving] = useState(false);
  const [cashError, setCashError] = useState('');

  useEffect(() => {
    appointmentAPI.getById(appointmentId)
      .then(({ data }) => setAppointment(data.data))
      .catch(() => setLoadError('Could not load appointment details.'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  // Doctor fee is stored in LKR on the appointment
  const amountLkr = appointment?.consultationFee || defaultAmountLkr;

  const handleSuccess = (lkr) => {
    setPaidAmount(lkr);
    setPaid(true);
  };

  const handleMarkCash = async () => {
    if (!appointment?._id) return;
    setCashError('');
    setCashSaving(true);
    try {
      const { data } = await appointmentAPI.markCash(appointment._id);
      setAppointment(data.data);
      setCashMarked(true);
    } catch (err) {
      setCashError(err.response?.data?.message || 'Failed to mark as cash payment.');
    } finally {
      setCashSaving(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 mt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center px-4">
        <p className="text-gray-800 dark:text-white font-semibold mb-2">{loadError}</p>
        <button onClick={() => navigate('/patient/appointments')} className="text-sm text-indigo-600 hover:underline">← My Appointments</button>
      </div>
    );
  }

  if (appointment?.paymentStatus === 'paid' && !paid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Already Paid</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Payment for this appointment has already been completed.</p>
        <button
          onClick={() => navigate('/patient/appointments')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition"
        >
          My Appointments
        </button>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (paid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Payment Successful!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {`Your card was charged the equivalent of ${formatLkr(paidAmount)} via Stripe.`}
        </p>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 text-left space-y-3 mb-6">
          <Row label="Appointment" value={`${formatDate(appointment.appointmentDate)} · ${formatTime(appointment.appointmentTime)}`} />
          <Row label="Doctor"      value={appointment.doctorName ? `Dr. ${appointment.doctorName}` : '—'} />
          <Row label="Type"        value={appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'} />
          <Row label="Method"      value="Card (Stripe)" />
          <Row label="Amount" value={formatLkr(paidAmount)} />
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          {appointment?.type === 'telemedicine' && (
            <button
              onClick={() => navigate(`/patient/telemedicine/${appointmentId}`)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition"
            >
              Join Session
            </button>
          )}
          <button
            onClick={() => navigate('/patient/appointments')}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            My Appointments
          </button>
        </div>
      </div>
    );
  }

  if (cashMarked || appointment?.cashPaymentRequested) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCheck className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Cash Payment Selected</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          You chose to pay in cash at the clinic/hospital. Online card payment is not required now.
        </p>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 text-left space-y-3 mb-6">
          <Row label="Appointment" value={`${formatDate(appointment.appointmentDate)} · ${formatTime(appointment.appointmentTime)}`} />
          <Row label="Doctor"      value={appointment.doctorName ? `Dr. ${appointment.doctorName}` : '—'} />
          <Row label="Type"        value={appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'} />
          <Row label="Method"      value="Cash" />
          <Row label="Amount" value={formatLkr(amountLkr)} />
        </div>
        <button
          onClick={() => navigate('/patient/appointments')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition"
        >
          My Appointments
        </button>
      </div>
    );
  }

  // ── Checkout form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <button
            onClick={() => navigate('/patient/appointments')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4"
          >
            <FiChevronLeft className="w-4 h-4" />
            My Appointments
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Payment Checkout</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Secured by Stripe</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid md:grid-cols-5 gap-6 md:gap-8">

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <Row label="Doctor"   value={appointment.doctorName ? `Dr. ${appointment.doctorName}` : '—'} />
                <Row label="Date"     value={formatDate(appointment.appointmentDate)} />
                <Row label="Time"     value={formatTime(appointment.appointmentTime)} />
                <Row label="Type"     value={appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'} />
                <Row label="Duration" value={`${appointment.duration} min`} />
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Total</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{formatLkr(amountLkr)}</span>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 sm:p-6">

              <Elements stripe={stripePromise}>
                <StripeForm appointment={appointment} amountLkr={amountLkr} onSuccess={handleSuccess} />
              </Elements>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleMarkCash}
                  disabled={cashSaving}
                  className="w-full py-2.5 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-md text-sm font-semibold transition disabled:opacity-60"
                >
                  {cashSaving ? 'Saving...' : 'Mark as Cash Payment'}
                </button>
                {cashError && (
                  <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2.5 mt-3">
                    {cashError}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
