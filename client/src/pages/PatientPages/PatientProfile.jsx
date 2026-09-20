import { useState, useEffect, useRef } from 'react';
import { patientAPI } from '../../utils/api';
import { useAuth } from '../../Context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiChevronDown, FiX, FiEdit2, FiPlus } from 'react-icons/fi';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SECTIONS = ['Personal', 'Address', 'Medical', 'Emergency', 'Security'];

const GENDER_OPTIONS   = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS     = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emptyMedication  = () => ({
  medicationName: '', dosage: '', frequency: '', prescribingDoctor: '',
});

const toDateInput = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionHeading = ({ title, desc }) => (
  <div className="mb-6">
    <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
    {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
  </div>
);

const Label = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = ({ value, onChange, type = 'text', placeholder, disabled }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
               text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
               disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed
               transition"
  />
);

const Select = ({ value, onChange, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                 cursor-pointer transition"
    >
      {children}
    </select>
    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  </div>
);

const SaveButton = ({ loading, label = 'Save Changes' }) => (
  <button
    type="submit"
    disabled={loading}
    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
               text-white text-sm font-semibold rounded-md transition active:scale-95"
  >
    {loading ? (
      <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
    ) : null}
    {label}
  </button>
);

// ── Tag input ─────────────────────────────────────────────────────────────────
const TagInput = ({ tags, onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };

  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800
                     rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded">
              {tag}
              <button type="button" onClick={() => remove(i)} className="hover:text-indigo-900 dark:hover:text-indigo-200">
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PatientProfile = () => {
  const { user, updateUser } = useAuth();
  const [active, setActive]   = useState('Personal');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Per-section save state
  const [saving, setSaving] = useState({});

  const fileRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', nic: '', dateOfBirth: '', gender: '', bloodGroup: '', phone: '',
  });
  const [address, setAddress] = useState({
    street: '', city: '', state: '', country: 'Sri Lanka', zipCode: '',
  });
  const [allergies, setAllergies]               = useState([]);
  const [chronicDiseases, setChronicDiseases]   = useState([]);
  const [medications, setMedications]           = useState([]);
  const [emergency, setEmergency]               = useState({ name: '', relationship: '', phone: '' });
  const [passwords, setPasswords]               = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const isGoogleAuth = user?.authProvider === 'google';
  const visibleSections = isGoogleAuth
    ? SECTIONS.filter((s) => s !== 'Security')
    : SECTIONS;

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    patientAPI.getProfile()
      .then(({ data }) => {
        const p = data.data;
        setProfile(p);
        setPersonal({
          firstName:   p.firstName   || '',
          lastName:    p.lastName    || '',
          nic:         p.nic         || '',
          dateOfBirth: toDateInput(p.dateOfBirth),
          gender:      p.gender      || '',
          bloodGroup:  p.bloodGroup  || '',
          phone:       p.phone       || '',
        });
        setAddress({
          street:  p.address?.street  || '',
          city:    p.address?.city    || '',
          state:   p.address?.state   || '',
          country: p.address?.country || 'Sri Lanka',
          zipCode: p.address?.zipCode || '',
        });
        setAllergies(p.allergies          || []);
        setChronicDiseases(p.chronicDiseases || []);
        setMedications(p.currentMedications || []);
        setEmergency({
          name:         p.emergencyContact?.name         || '',
          relationship: p.emergencyContact?.relationship || '',
          phone:        p.emergencyContact?.phone        || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const savePersonal = async (e) => {
    e.preventDefault();
    setSaving((s) => ({ ...s, personal: true }));
    try {
      const { data } = await patientAPI.updateProfile(personal);
      setProfile(data.data);
      if (updateUser) updateUser({ name: `${personal.firstName} ${personal.lastName}` });
    } catch {
    } finally {
      setSaving((s) => ({ ...s, personal: false }));
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSaving((s) => ({ ...s, address: true }));
    try {
      await patientAPI.updateProfile({ address });
    } catch {
    } finally {
      setSaving((s) => ({ ...s, address: false }));
    }
  };

  const saveMedical = async (e) => {
    e.preventDefault();
    setSaving((s) => ({ ...s, medical: true }));
    try {
      await patientAPI.updateProfile({ allergies, chronicDiseases, currentMedications: medications });
    } catch {
    } finally {
      setSaving((s) => ({ ...s, medical: false }));
    }
  };

  const saveEmergency = async (e) => {
    e.preventDefault();
    setSaving((s) => ({ ...s, emergency: true }));
    try {
      await patientAPI.updateProfile({ emergencyContact: emergency });
    } catch {
    } finally {
      setSaving((s) => ({ ...s, emergency: false }));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setSaving((s) => ({ ...s, security: true }));
    try {
      await patientAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
    } finally {
      setSaving((s) => ({ ...s, security: false }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profileImage', file);
    setImageUploading(true);
    try {
      const { data } = await patientAPI.uploadImage(fd);
      setProfile((p) => ({ ...p, profileImage: data.data.profileImage }));
      if (updateUser) updateUser({ profileImage: data.data.profileImage });
    } catch {
    } finally {
      setImageUploading(false);
      fileRef.current.value = '';
    }
  };

  // Medication row helpers
  const updateMed = (i, field, val) =>
    setMedications((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  const removeMed = (i) => setMedications((prev) => prev.filter((_, idx) => idx !== i));
  const addMed    = () => setMedications((prev) => [...prev, emptyMedication()]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-64 mt-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Profile header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 mb-10">
        <div className="relative shrink-0">
          {profile?.profileImage ? (
            <img src={profile.profileImage} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current.click()}
            disabled={imageUploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow transition"
            title="Change photo"
          >
            {imageUploading ? (
              <div className="animate-spin rounded-full w-3 h-3 border-2 border-white border-t-transparent" />
            ) : (
              <FiEdit2 className="w-3 h-3 text-white" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {profile?.firstName} {profile?.lastName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">

        {/* ── Sidebar nav ───────────────────────────────────────────────────── */}
        <nav className="hidden md:flex flex-col gap-1 shrink-0 w-44">
          {visibleSections.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active === s
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        {/* ── Mobile tab row ────────────────────────────────────────────────── */}
        <div className="md:hidden w-full">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {visibleSections.map((s) => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active === s
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content panel ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* ── Personal ── */}
          {active === 'Personal' && (
            <form onSubmit={savePersonal}>
              <SectionHeading title="Personal Information" desc="Update your name, contact details, and basic health info." />

              {/* Email — read only */}
              <div className="mb-4">
                <Label>Email address</Label>
                <Input value={profile?.email || ''} disabled />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label required>First name</Label>
                  <Input value={personal.firstName} onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))} placeholder="John" />
                </div>
                <div>
                  <Label required>Last name</Label>
                  <Input value={personal.lastName} onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>NIC</Label>
                  <Input value={personal.nic} onChange={(e) => setPersonal((p) => ({ ...p, nic: e.target.value }))} placeholder="National Identity Card" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))} placeholder="+94 77 000 0000" />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>Date of birth</Label>
                  <Input type="date" value={personal.dateOfBirth} onChange={(e) => setPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={personal.gender} onChange={(e) => setPersonal((p) => ({ ...p, gender: e.target.value }))}>
                    <option value="">— Select —</option>
                    {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Blood group</Label>
                  <Select value={personal.bloodGroup} onChange={(e) => setPersonal((p) => ({ ...p, bloodGroup: e.target.value }))}>
                    <option value="">— Select —</option>
                    {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </div>
              </div>

              <SaveButton loading={saving.personal} />
            </form>
          )}

          {/* ── Address ── */}
          {active === 'Address' && (
            <form onSubmit={saveAddress}>
              <SectionHeading title="Address" desc="Your residential address for medical records." />

              <div className="mb-4">
                <Label>Street</Label>
                <Input value={address.street} onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} placeholder="123 Main St" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>City</Label>
                  <Input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="Colombo" />
                </div>
                <div>
                  <Label>State / Province</Label>
                  <Input value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} placeholder="Western" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Country</Label>
                  <Input value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} placeholder="Sri Lanka" />
                </div>
                <div>
                  <Label>ZIP / Postal code</Label>
                  <Input value={address.zipCode} onChange={(e) => setAddress((a) => ({ ...a, zipCode: e.target.value }))} placeholder="00100" />
                </div>
              </div>

              <SaveButton loading={saving.address} />
            </form>
          )}

          {/* ── Medical ── */}
          {active === 'Medical' && (
            <form onSubmit={saveMedical}>
              <SectionHeading title="Medical Information" desc="Keep your health information up to date for accurate care." />

              {/* Allergies */}
              <div className="mb-6">
                <Label>Allergies</Label>
                <TagInput tags={allergies} onChange={setAllergies} placeholder="e.g. Penicillin — press Enter to add" />
              </div>

              {/* Chronic diseases */}
              <div className="mb-6">
                <Label>Chronic diseases</Label>
                <TagInput tags={chronicDiseases} onChange={setChronicDiseases} placeholder="e.g. Diabetes — press Enter to add" />
              </div>

              {/* Current medications */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Label>Current medications</Label>
                  <button
                    type="button"
                    onClick={addMed}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    Add medication
                  </button>
                </div>

                {medications.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No medications added.</p>
                ) : (
                  <div className="space-y-3">
                    {medications.map((med, i) => (
                      <div key={i} className="grid sm:grid-cols-4 gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-md relative">
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Medication name</label>
                          <Input value={med.medicationName} onChange={(e) => updateMed(i, 'medicationName', e.target.value)} placeholder="Metformin" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Dosage</label>
                          <Input value={med.dosage} onChange={(e) => updateMed(i, 'dosage', e.target.value)} placeholder="500mg" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Frequency</label>
                          <Input value={med.frequency} onChange={(e) => updateMed(i, 'frequency', e.target.value)} placeholder="Twice daily" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Prescribing doctor</label>
                          <Input value={med.prescribingDoctor} onChange={(e) => updateMed(i, 'prescribingDoctor', e.target.value)} placeholder="Dr. Silva" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMed(i)}
                          className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <SaveButton loading={saving.medical} />
            </form>
          )}

          {/* ── Emergency ── */}
          {active === 'Emergency' && (
            <form onSubmit={saveEmergency}>
              <SectionHeading title="Emergency Contact" desc="Someone to contact in case of a medical emergency." />

              <div className="mb-4">
                <Label>Full name</Label>
                <Input value={emergency.name} onChange={(e) => setEmergency((ec) => ({ ...ec, name: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Relationship</Label>
                  <Input value={emergency.relationship} onChange={(e) => setEmergency((ec) => ({ ...ec, relationship: e.target.value }))} placeholder="Spouse, Parent, Sibling…" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={emergency.phone} onChange={(e) => setEmergency((ec) => ({ ...ec, phone: e.target.value }))} placeholder="+94 77 000 0000" />
                </div>
              </div>

              <SaveButton loading={saving.emergency} />
            </form>
          )}

          {/* ── Security ── */}
          {!isGoogleAuth && active === 'Security' && (
            <form onSubmit={savePassword}>
              <SectionHeading title="Change Password" desc="Use a strong password of at least 8 characters." />

              <div className="mb-4">
                <Label required>Current password</Label>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label required>New password</Label>
                  <Input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div>
                  <Label required>Confirm new password</Label>
                  <Input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <SaveButton loading={saving.security} label="Change Password" />
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
