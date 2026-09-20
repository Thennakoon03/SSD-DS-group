import axios from 'axios';

const MAX_SMS_TEXT_LENGTH = 1000;

// Convert Sri Lankan numbers to Text.lk-compatible format: 94XXXXXXXXX.
const normalizeToTextLkRecipient = (raw) => {
  if (!raw) return '';

  const cleaned = String(raw).replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+94')) return cleaned.slice(1);
  if (cleaned.startsWith('94')) return cleaned;
  if (cleaned.startsWith('0')) return `94${cleaned.slice(1)}`;

  return cleaned;
};

const normalizeMessageText = (text) => {
  if (!text) return '';
  const compact = String(text).replace(/\s+/g, ' ').trim();
  if (compact.length <= MAX_SMS_TEXT_LENGTH) return compact;
  return `${compact.slice(0, MAX_SMS_TEXT_LENGTH - 3)}...`;
};

/**
 * Send an SMS notification via Text.lk HTTP API.
 * @param {string} to   - Sri Lankan phone number (e.g., 077xxxxxxx / +9477xxxxxxx / 9477xxxxxxx)
 * @param {string} body - Message text body
 * @param {{ senderId?: string }} [options]
 * @returns {{ success: boolean, error?: string }}
 */
export const sendSMS = async (to, body, options = {}) => {
  try {
    const endpoint = process.env.TEXTLK_HTTP_ENDPOINT || 'https://app.text.lk/api/http/sms/send';
    const apiToken = process.env.TEXTLK_API_TOKEN;
    const senderId = process.env.TEXTLK_SENDER_ID || '';
    const normalizedTo = normalizeToTextLkRecipient(to);
    const smsBody = normalizeMessageText(body);

    if (!apiToken) {
      console.warn('[SMSService] Text.lk API token not set - skipping notification');
      return { success: false, error: 'Text.lk API token not configured' };
    }

    if (!normalizedTo) {
      return { success: false, error: 'Recipient phone number is invalid' };
    }

    const payload = {
      recipient: normalizedTo,
      message: smsBody,
    };

    const effectiveSenderId = options.senderId || senderId;
    if (effectiveSenderId) payload.sender_id = effectiveSenderId;

    const response = await axios.get(endpoint, {
      params: {
        api_token: apiToken,
        ...payload,
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    const responseBody = response.data || {};
    const statusValue = String(responseBody.status || '').toLowerCase();
    const isSuccess = response.status >= 200
      && response.status < 300
      && (statusValue === 'success' || statusValue === 'ok');

    if (!isSuccess) {
      const providerMessage = responseBody.message || 'Unknown provider response';
      return {
        success: false,
        error: `${providerMessage} (http ${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    const providerError = error.response?.data;
    const detail = providerError
      ? JSON.stringify(providerError)
      : (error.message || String(error));
    console.error(`[SMSService] Failed to send message to ${to}: ${detail}`);
    return { success: false, error: detail };
  }
};

// SMS message templates

export const appointmentBookedSMS = ({ recipientName, doctorName, date, time }) =>
  normalizeMessageText(`Mediconnect: Hi ${recipientName}, appointment booked with Dr. ${doctorName} on ${date} at ${time}.`);

export const appointmentConfirmedSMS = ({ recipientName, doctorName, date, time }) =>
  normalizeMessageText(`Mediconnect: Hi ${recipientName}, appointment confirmed with Dr. ${doctorName} on ${date} at ${time}.`);

export const appointmentCancelledSMS = ({ recipientName, doctorName, date, time }) =>
  normalizeMessageText(`Mediconnect: Hi ${recipientName}, appointment with Dr. ${doctorName} on ${date} at ${time} was cancelled. Please rebook.`);

export const appointmentCompletedSMS = ({ recipientName, doctorName }) =>
  normalizeMessageText(`Mediconnect: Hi ${recipientName}, your appointment with Dr. ${doctorName} is completed.`);

export const consultationCompletedSMS = ({ recipientName, doctorName, durationMinutes }) =>
  normalizeMessageText(`Mediconnect: Hi ${recipientName}, video consultation with Dr. ${doctorName}${durationMinutes ? ` (${durationMinutes} min)` : ''} is completed.`);
