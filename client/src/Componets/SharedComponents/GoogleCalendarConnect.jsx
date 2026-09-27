import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { googleCalendarAPI } from '../../utils/api';

// "Connect Google Calendar" — starts the OAuth 2.0 Authorization Code + PKCE
// flow: fetches an authUrl from the backend (which generates state + PKCE
// and remembers them against the logged-in user), then does a full-page
// redirect to Google's consent screen. Google redirects back to
// /settings/google-calendar/callback, which exchanges the code server-side.
const GoogleCalendarConnect = () => {
  const [status, setStatus]   = useState(null); // { connected, connectedAt }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await googleCalendarAPI.getStatus();
      setStatus(data.data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const { data } = await googleCalendarAPI.getAuthUrl();
      window.location.href = data.data.authUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start Google Calendar connection');
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await googleCalendarAPI.disconnect();
      toast.success('Google Calendar disconnected');
      await loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not disconnect Google Calendar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Google Calendar</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Automatically add confirmed appointments to your Google Calendar and remove them if cancelled.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <FiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Checking connection…</p>
            ) : status?.connected ? (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                  <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> Connected
                </p>
                {status.connectedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Since {new Date(status.connectedAt).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-gray-900 dark:text-white">Not connected</p>
            )}
          </div>
        </div>

        {!loading && (
          <button
            type="button"
            onClick={status?.connected ? handleDisconnect : handleConnect}
            disabled={busy}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition active:scale-95 disabled:opacity-60 ${
              status?.connected
                ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {busy && <FiLoader className="w-4 h-4 animate-spin" />}
            {status?.connected ? 'Disconnect' : 'Connect Google Calendar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarConnect;
