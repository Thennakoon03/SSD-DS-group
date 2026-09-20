import nodemailer from 'nodemailer';

// Create a reusable transporter using Gmail SMTP
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password (not your login password)
    },
  });

/**
 * Send an email notification.
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html    - HTML body
 * @returns {{ success: boolean, error?: string }}
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Healthcare Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error(`[EmailService] Failed to send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ── HTML email templates ───────────────────────────────────────────────────

const baseTemplate = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px;
                 box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #0077cc; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .body h2 { color: #0077cc; margin-top: 0; }
    .info-box { background: #f0f7ff; border-left: 4px solid #0077cc; padding: 12px 20px;
                border-radius: 4px; margin: 20px 0; }
    .info-box p { margin: 4px 0; }
    .footer { background: #f4f4f4; text-align: center; padding: 16px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Mediconnect</h1></div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">© 2026 Mediconnect. This is an automated message.</div>
  </div>
</body>
</html>`;

export const appointmentBookedEmail = ({ recipientName, patientName, doctorName, date, time, type }) =>
  baseTemplate(
    'Appointment Booked',
    `<p>Dear <strong>${recipientName}</strong>,</p>
     <p>Your appointment has been successfully booked.</p>
     <div class="info-box">
       <p><strong>Patient:</strong> ${patientName}</p>
       <p><strong>Doctor:</strong> ${doctorName}</p>
       <p><strong>Date:</strong> ${date}</p>
       <p><strong>Time:</strong> ${time}</p>
       <p><strong>Type:</strong> ${type === 'telemedicine' ? 'Telemedicine (Video Call)' : 'In-Person'}</p>
     </div>
     <p>Please arrive 10 minutes early for in-person visits.</p>`
  );

export const appointmentConfirmedEmail = ({ recipientName, patientName, doctorName, date, time, type }) =>
  baseTemplate(
    'Appointment Confirmed',
    `<p>Dear <strong>${recipientName}</strong>,</p>
     <p>Your appointment has been <strong style="color:green">confirmed</strong>.</p>
     <div class="info-box">
       <p><strong>Patient:</strong> ${patientName}</p>
       <p><strong>Doctor:</strong> ${doctorName}</p>
       <p><strong>Date:</strong> ${date}</p>
       <p><strong>Time:</strong> ${time}</p>
       <p><strong>Type:</strong> ${type === 'telemedicine' ? 'Telemedicine (Video Call)' : 'In-Person'}</p>
     </div>`
  );

export const appointmentCancelledEmail = ({ recipientName, patientName, doctorName, date, time, cancelledBy, reason }) =>
  baseTemplate(
    'Appointment Cancelled',
    `<p>Dear <strong>${recipientName}</strong>,</p>
     <p>An appointment has been <strong style="color:red">cancelled</strong>.</p>
     <div class="info-box">
       <p><strong>Patient:</strong> ${patientName}</p>
       <p><strong>Doctor:</strong> ${doctorName}</p>
       <p><strong>Date:</strong> ${date}</p>
       <p><strong>Time:</strong> ${time}</p>
       <p><strong>Cancelled by:</strong> ${cancelledBy}</p>
       ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
     </div>
     <p>Please book a new appointment if needed.</p>`
  );

export const appointmentCompletedEmail = ({ recipientName, patientName, doctorName, date }) =>
  baseTemplate(
    'Appointment Completed',
    `<p>Dear <strong>${recipientName}</strong>,</p>
     <p>Your appointment has been marked as <strong style="color:#0077cc">completed</strong>.</p>
     <div class="info-box">
       <p><strong>Patient:</strong> ${patientName}</p>
       <p><strong>Doctor:</strong> ${doctorName}</p>
       <p><strong>Date:</strong> ${date}</p>
     </div>
     <p>Thank you for using our platform. Your health records have been updated.</p>`
  );

export const consultationCompletedEmail = ({ recipientName, patientName, doctorName, durationMinutes }) =>
  baseTemplate(
    'Video Consultation Completed',
    `<p>Dear <strong>${recipientName}</strong>,</p>
     <p>Your video consultation has been <strong style="color:#0077cc">completed</strong>.</p>
     <div class="info-box">
       <p><strong>Patient:</strong> ${patientName}</p>
       <p><strong>Doctor:</strong> ${doctorName}</p>
       ${durationMinutes ? `<p><strong>Duration:</strong> ${durationMinutes} minutes</p>` : ''}
     </div>
     <p>Thank you for using our telemedicine service.</p>`
  );
