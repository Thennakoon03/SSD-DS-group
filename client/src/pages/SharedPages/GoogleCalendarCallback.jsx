import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../Context/AuthContext';
import { googleCalendarAPI } from '../../utils/api';

// Google redirects the browser here after the user consents (or denies) on
// Google's own consent screen, with ?code=...&state=... in the URL. This page
// hands that code + state to our backend, which does the actual token
// exchange (Authorization Code + PKCE grant) — the code_verifier and client
// secret never touch the browser.
const GoogleCalendarCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('Connecting your Google Calendar…');
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const code       = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setState('error');
      setMessage(oauthError === 'access_denied' ? 'You declined Google Calendar access.' : 'Google returned an error.');
      return;
    }

    if (!code || !stateParam) {
      setState('error');
      setMessage('Missing authorization code from Google.');
      return;
    }

    (async () => {
      try {
        await googleCalendarAPI.exchangeCode(code, stateParam);
        setState('success');
        setMessage('Google Calendar connected successfully.');
      } catch (err) {
        setState('error');
        setMessage(err.response?.data?.message || 'Failed to connect Google Calendar.');
      }
    })();
  }, [searchParams]);

  const backToProfile = () => {
    const role = user?.role || 'patient';
    navigate(`/${role}/profile`, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 shadow-sm">
        {state === 'pending' && <FiLoader className="w-10 h-10 mx-auto mb-4 text-indigo-600 animate-spin" />}
        {state === 'success' && <FiCheckCircle className="w-10 h-10 mx-auto mb-4 text-green-600" />}
        {state === 'error'   && <FiXCircle className="w-10 h-10 mx-auto mb-4 text-red-600" />}

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">{message}</p>

        {state !== 'pending' && (
          <button
            type="button"
            onClick={backToProfile}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition active:scale-95"
          >
            Back to profile
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
