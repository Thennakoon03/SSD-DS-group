import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI, paymentAPI, doctorAPI } from '../../utils/api';
import { FiChevronLeft, FiCheck, FiEdit2, FiVideo, FiX, FiCalendar, FiUser, FiFileText, FiCreditCard, FiPaperclip, FiUpload, FiTrash2, FiExternalLink } from 'react-icons/fi';
import CancelAppointmentModal from '../../Componets/DoctorComponents/CancelAppointmentModal';
import NotesModal from '../../Componets/DoctorComponents/NotesModal';
import PrescriptionModal from '../../Componets/DoctorComponents/PrescriptionModal';
import StatusUpdateModal from '../../Componets/DoctorComponents/StatusUpdateModal';
import DeleteConfirmModal from '../../Componets/SharedComponents/DeleteConfirmModal';

//Helpers
const STATUS_STYLES = {
  pending:       'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled:     'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  no_show:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  not_responded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const PAYMENT_STYLES = {
  paid:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  refunded:'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const formatCreated = (iso) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// InfoRow 
const InfoRow = ({ label, value, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 sm:w-40 shrink-0 pt-0.5">
      {label}
    </span>
    <span className="text-sm text-gray-800 dark:text-gray-200">{children || value || '—'}</span>
  </div>
);

// Section
const Section = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="px-5 py-4 space-y-3">{children}</div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt]         = useState(null);
  const [patient, setPatient]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]       = useState('');

  const [modal, setModal] = useState(null); // 'status' | 'cancel' | 'notes' | 'prescription' | 'delete-prescription'

  // Load appointment — payment status comes directly from appointment DB
  useEffect(() => {
    setLoading(true);
    appointmentAPI.getById(id)
      .then(({ data }) => setAppt(data.data))
      .catch(() => setError('Failed to load appointment.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch patient details after appointment loads
  useEffect(() => {
    if (!appt?.patientId) return;
    doctorAPI.getPatientDetails(appt.patientId)
      .then(({ data }) => setPatient(data.data))
      .catch(() => {}); // non-fatal
  }, [appt?.patientId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Update status
  const handleStatusUpdate = async (status, notes) => {
    setActionLoading(true);
    try {
      const { data } = await appointmentAPI.updateStatus(id, { status, notes: notes || undefined });
      setAppt(data.data);
      setModal(null);
      showToast('Status updated successfully.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel
  const handleCancel = async (reason) => {
    setActionLoading(true);
    try {
      const { data } = await appointmentAPI.cancel(id, { cancellationReason: reason || undefined });
      setAppt(data.data);
      setModal(null);
      showToast('Appointment cancelled.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to cancel.');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload prescription
  const handleUploadPrescription = async (formData) => {
    setActionLoading(true);
    try {
      const { data } = await appointmentAPI.uploadPrescription(id, formData);
      setAppt(data.data);
      setModal(null);
      showToast('Prescription uploaded successfully.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to upload prescription.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete prescription
  const handleDeletePrescription = async () => {
    setActionLoading(true);
    try {
      const { data } = await appointmentAPI.deletePrescription(id);
      setAppt(data.data);
      setModal(null);
      showToast('Prescription removed.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete prescription.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save notes
  const handleSaveNotes = async (notes) => {
    setActionLoading(true);
    try {
      const { data } = await appointmentAPI.addNotes(id, { notes });
      setAppt(data.data);
      setModal(null);
      showToast('Notes saved.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save notes.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark cash payment as paid
  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      // Create a payment record for cash and mark appointment as paid
      let paymentIntentId = null;
      try {
        const { data: intentRes } = await paymentAPI.createIntent({
          appointmentId: appt._id,
          doctorId:      appt.doctorId,
          amount:        Math.round((appt.consultationFee || 0) * 100),
          itemName:      `Consultation — Cash`,
        });
        paymentIntentId = intentRes.data.paymentIntentId;
      } catch (e) {
        if (e.response?.status === 409) {
          paymentIntentId = e.response.data?.data?.paymentIntentId;
        }
      }
      if (paymentIntentId) {
        await paymentAPI.confirmTest({ paymentIntentId }).catch(() => {});
      }
      const { data } = await appointmentAPI.markPaid(id);
      setAppt(data.data);
      showToast('Payment marked as paid.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to mark as paid.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Appointment not found.'}</p>
        <button onClick={() => navigate('/doctor/appointments')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to appointments
        </button>
      </div>
    );
  }

  const canUpdateStatus      = ['pending', 'confirmed'].includes(appt.status);
  const canCancel            = ['pending', 'confirmed'].includes(appt.status);
  const canAddNotes          = appt.status === 'completed';
  const canMarkPaid          = appt.paymentStatus === 'pending';
  const canStartTelemedicine    = appt.type === 'telemedicine' && appt.status === 'confirmed';
  const sessionCompleted        = appt.type === 'telemedicine' && appt.status === 'completed';
  const canManagePrescription   = appt.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2.5 rounded-md shadow-lg">
          {toast}
        </div>
      )}

      {/* Modals */}
      {modal === 'status' && (
        <StatusUpdateModal
          current={appt.status}
          onClose={() => setModal(null)}
          onSave={handleStatusUpdate}
          loading={actionLoading}
        />
      )}
      {modal === 'cancel' && (
        <CancelAppointmentModal
          onClose={() => setModal(null)}
          onConfirm={handleCancel}
          loading={actionLoading}
        />
      )}
      {modal === 'notes' && (
        <NotesModal
          initial={appt.notes}
          onClose={() => setModal(null)}
          onSave={handleSaveNotes}
          loading={actionLoading}
        />
      )}
      {modal === 'prescription' && (
        <PrescriptionModal
          onClose={() => setModal(null)}
          onSave={handleUploadPrescription}
          loading={actionLoading}
        />
      )}
      {modal === 'delete-prescription' && (
        <DeleteConfirmModal
          onClose={() => setModal(null)}
          onConfirm={handleDeletePrescription}
          loading={actionLoading}
          title="Delete prescription?"
          message="The uploaded prescription will be permanently removed from this appointment. This action cannot be undone."
          confirmText="Delete"
          cancelText="Keep"
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
          >
            <FiChevronLeft className="w-4 h-4" />
            Back to appointments
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Appointment Details</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Booked on {formatCreated(appt.createdAt)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {canUpdateStatus && (
            <button
              onClick={() => setModal('status')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition"
            >
              <FiCheck className="w-4 h-4" />
              Update Status
            </button>
          )}
          {canAddNotes && (
            <button
              onClick={() => setModal('notes')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition"
            >
              <FiEdit2 className="w-4 h-4" />
              {appt.notes ? 'Edit Notes' : 'Add Notes'}
            </button>
          )}
          {canManagePrescription && (
            appt.prescription?.fileUrl ? (
              <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-md">
                <FiCheck className="w-4 h-4" />
                Prescription Uploaded
              </span>
            ) : (
              <button
                onClick={() => setModal('prescription')}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-md transition"
              >
                <FiUpload className="w-4 h-4" />
                Upload Prescription
              </button>
            )
          )}
          {canStartTelemedicine && (
            <button
              onClick={() => navigate(`/doctor/telemedicine/${appt._id}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition"
            >
              <FiVideo className="w-4 h-4" />
              Start Session
            </button>
          )}
          {sessionCompleted && (
            <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <FiCheck className="w-4 h-4" />
              Session Completed
            </span>
          )}
          {canCancel && (
            <button
              onClick={() => setModal('cancel')}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold rounded-md transition"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          )}
          
        </div>
      </div>

      {/* Status + type badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`text-xs font-semibold px-3 py-1 rounded capitalize ${STATUS_STYLES[appt.status]}`}>
          {appt.status.replace('_', ' ')}
        </span>
        <span className="text-xs font-semibold px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
          {appt.type === 'telemedicine' ? '📹 Telemedicine' : '🏥 In-Person'}
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded capitalize ${PAYMENT_STYLES[appt.paymentStatus]}`}>
          Payment: {appt.paymentStatus}
        </span>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Appointment info */}
        <Section
          title="Appointment"
          icon={<FiCalendar className="w-4 h-4" />}
        >
          <InfoRow label="Date">{formatDate(appt.appointmentDate)}</InfoRow>
          <InfoRow label="Time" value={appt.appointmentTime} />
          <InfoRow label="Duration">{appt.duration} minutes</InfoRow>
          <InfoRow label="Type" value={appt.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'} />
        </Section>

        {/* Patient info */}
        <Section
          title="Patient"
          icon={<FiUser className="w-4 h-4" />}
        >
          {/* Avatar + name header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            {patient?.profileImage ? (
              <img
                src={patient.profileImage}
                alt="patient"
                className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
                  {(appt.patientName || 'P').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {patient?.name || appt.patientName || 'Unknown'}
              </p>
              {patient?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{patient.email}</p>
              )}
            </div>
          </div>

          {/* Core details */}
          {patient?.phone    && <InfoRow label="Phone"      value={patient.phone} />}
          {patient?.gender   && <InfoRow label="Gender"     value={patient.gender} />}
          {patient?.age != null && <InfoRow label="Age">{patient.age} years</InfoRow>}
          {patient?.bloodGroup && <InfoRow label="Blood Group" value={patient.bloodGroup} />}

          {/* Allergies */}
          {patient?.allergies?.length > 0 && (
            <InfoRow label="Allergies">
              <div className="flex flex-wrap gap-1">
                {patient.allergies.map((a, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                  >{a}</span>
                ))}
              </div>
            </InfoRow>
          )}

          {/* Chronic diseases */}
          {patient?.chronicDiseases?.length > 0 && (
            <InfoRow label="Chronic Conditions">
              <div className="flex flex-wrap gap-1">
                {patient.chronicDiseases.map((d, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
                  >{d}</span>
                ))}
              </div>
            </InfoRow>
          )}

          {/* Emergency contact */}
          {patient?.emergencyContact?.name && (
            <InfoRow label="Emergency Contact">
              {patient.emergencyContact.name}
              {patient.emergencyContact.relationship ? ` (${patient.emergencyContact.relationship})` : ''}
              {patient.emergencyContact.phone ? ` · ${patient.emergencyContact.phone}` : ''}
            </InfoRow>
          )}
        </Section>

        {/* Reason */}
        {appt.reason && (
          <Section
            title="Reason for Visit"
            icon={<FiFileText className="w-4 h-4" />}
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{appt.reason}</p>
          </Section>
        )}

        {/* Clinical notes */}
        <Section
          title="Clinical Notes"
          icon={<FiEdit2 className="w-4 h-4" />}
        >
          {appt.notes ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{appt.notes}</p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No notes added yet.</p>
          )}
        </Section>

        {/* Payment info */}
        <Section
          title="Payment"
          icon={<FiCreditCard className="w-4 h-4" />}
        >
          <InfoRow label="Status">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${PAYMENT_STYLES[appt.paymentStatus]}`}>
              {appt.paymentStatus}
            </span>
          </InfoRow>
          <InfoRow label="Method" value={appt.paymentMethod ? appt.paymentMethod.charAt(0).toUpperCase() + appt.paymentMethod.slice(1) : '—'} />
        </Section>

        {/* Cancellation */}
        {appt.status === 'cancelled' && (
          <Section
            title="Cancellation"
            icon={<FiX className="w-4 h-4 text-red-400" />}
          >
            <InfoRow label="Cancelled by" value={appt.cancelledBy ? (appt.cancelledBy.charAt(0).toUpperCase() + appt.cancelledBy.slice(1)) : '—'} />
            <InfoRow label="Reason" value={appt.cancellationReason || 'No reason provided'} />
          </Section>
        )}

        {/* Prescription */}
        <Section
          title="Prescription"
          icon={<FiFileText className="w-4 h-4" />}
        >
          {appt.prescription?.fileUrl ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <a
                  href={appt.prescription.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-teal-700 dark:text-teal-400 hover:underline"
                >
                  <FiExternalLink className="w-4 h-4 shrink-0" />
                  View Prescription
                </a>
                <button
                  onClick={() => setModal('delete-prescription')}
                  disabled={actionLoading}
                  title="Delete prescription"
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-40"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {appt.prescription.uploadedAt && (
                <p className="text-xs text-gray-400">
                  Uploaded {new Date(appt.prescription.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {appt.prescription.notes && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{appt.prescription.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              {appt.status === 'completed' ? 'No prescription uploaded yet.' : 'Available after appointment is completed.'}
            </p>
          )}
        </Section>

        {/* Attached reports */}
        {appt.attachedReports?.length > 0 && (
          <Section
            title="Attached Reports"
            icon={<FiPaperclip className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-2">
              {appt.attachedReports.map((r) => (
                <a
                  key={r.reportId}
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <FiFileText className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{r.title}</span>
                  {r.reportType && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 capitalize shrink-0">
                      {r.reportType.replace('_', ' ')}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default AppointmentDetails;
