import { useState, useEffect, useRef } from "react";
import { doctorAPI } from "../../utils/api";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-hot-toast";
import { FiChevronDown, FiEdit2 } from "react-icons/fi";

// ── Constants ─────────────────────────────────────────────────────────────────
const SECTIONS = ["Personal", "Professional", "Address", "Security"];

const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Endocrinologist",
  "Gastroenterologist",
  "Hematologist",
  "Infectious Disease Specialist",
  "Nephrologist",
  "Neurologist",
  "Obstetrician/Gynecologist",
  "Oncologist",
  "Ophthalmologist",
  "Orthopedic Surgeon",
  "Otolaryngologist",
  "Pediatrician",
  "Psychiatrist",
  "Pulmonologist",
  "Radiologist",
  "Rheumatologist",
  "Surgeon",
  "Urologist",
  "General Practitioner",
  "Emergency Medicine",
];

const GENDERS = ["Male", "Female", "Other"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const toDateInput = (iso) => {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionHeading = ({ title, desc }) => (
  <div className="mb-6">
    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
      {title}
    </h2>
    {desc && (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
    )}
  </div>
);

const Label = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const inputCls = `w-full px-3.5 py-2.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
  text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
  disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed
  transition`;

const Input = ({ value, onChange, type = "text", placeholder, disabled }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={inputCls}
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

const SaveButton = ({ loading, label = "Save Changes" }) => (
  <button
    type="submit"
    disabled={loading}
    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
               text-white text-sm font-semibold rounded-md transition active:scale-95"
  >
    {loading && (
      <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
    )}
    {label}
  </button>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const DoctorProfile = () => {
  const { user } = useAuth();
  const imageInputRef = useRef(null);
  const [active, setActive] = useState("Personal");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Per-section save state
  const [saving, setSaving] = useState({});

  const [imgUploading, setImgUploading] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
  });
  const [professional, setProfessional] = useState({
    qualifications: "",
    description: "",
    licenseNumber: "",
    hospital: "",
    experience: "",
    consultationFee: "",
    isAvailable: true,
    specialization: [],
  });
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "Sri Lanka",
    zipCode: "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isGoogleAuth = user?.authProvider === "google";
  const visibleSections = isGoogleAuth
    ? SECTIONS.filter((s) => s !== "Security")
    : SECTIONS;

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    doctorAPI
      .getProfile()
      .then(({ data }) => {
        const d = data.data;
        setProfile(d);
        setPersonal({
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          phone: d.phone || "",
          gender: d.gender || "",
          dateOfBirth: toDateInput(d.dateOfBirth),
        });
        setProfessional({
          qualifications: d.qualifications || "",
          description: d.description || "",
          licenseNumber: d.licenseNumber || "",
          hospital: d.hospital || "",
          experience: d.experience ?? "",
          consultationFee: d.consultationFee ?? "",
          isAvailable: d.isAvailable ?? true,
          specialization: d.specialization || [],
        });
        setAddress({
          street: d.address?.street || "",
          city: d.address?.city || "",
          state: d.address?.state || "",
          country: d.address?.country || "Sri Lanka",
          zipCode: d.address?.zipCode || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setSav = (key, val) => setSaving((s) => ({ ...s, [key]: val }));

  // ── Save handlers ──────────────────────────────────────────────────────────
  const savePersonal = async (e) => {
    e.preventDefault();
    setSav("personal", true);
    try {
      const { data } = await doctorAPI.updateProfile(personal);
      setProfile(data.data);
    } catch {
    } finally {
      setSav("personal", false);
    }
  };

  const saveProfessional = async (e) => {
    e.preventDefault();
    setSav("professional", true);
    try {
      const payload = {
        ...professional,
        experience:
          professional.experience !== "" ? Number(professional.experience) : 0,
        consultationFee:
          professional.consultationFee !== ""
            ? Number(professional.consultationFee)
            : 0,
      };
      const { data } = await doctorAPI.updateProfile(payload);
      setProfile(data.data);
    } catch {
    } finally {
      setSav("professional", false);
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSav("address", true);
    try {
      await doctorAPI.updateProfile({ address });
    } catch {
    } finally {
      setSav("address", false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setSav("security", true);
    try {
      await doctorAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
    } finally {
      setSav("security", false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("profileImage", file);
      const { data } = await doctorAPI.uploadImage(fd);
      setProfile((p) => ({
        ...p,
        profileImage: data.data?.profileImage || data.data,
      }));
    } catch {
    } finally {
      setImgUploading(false);
      e.target.value = "";
    }
  };

  const toggleSpec = (spec) => {
    setProfessional((f) => ({
      ...f,
      specialization: f.specialization.includes(spec)
        ? f.specialization.filter((s) => s !== spec)
        : [...f.specialization, spec],
    }));
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const initials =
    `${personal.firstName?.[0] || ""}${personal.lastName?.[0] || ""}`.toUpperCase() ||
    "DR";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 mb-8">
        {/* Avatar with edit button */}
        <div className="relative shrink-0">
          {profile?.profileImage ? (
            <img
              src={profile.profileImage}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-800">
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                {initials}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={imgUploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow transition"
            title="Change photo"
          >
            {imgUploading ? (
              <div className="animate-spin rounded-full w-3 h-3 border-2 border-white border-t-transparent" />
            ) : (
              <FiEdit2 className="w-3 h-3 text-white" />
            )}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dr. {personal.firstName} {personal.lastName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile?.email}
          </p>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                profile?.isVerified
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                  : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400"
              }`}
            >
              {profile?.isVerified ? "✓ Verified" : "⏳ Pending Verification"}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer ${
                professional.isAvailable
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
              onClick={() =>
                setProfessional((f) => ({ ...f, isAvailable: !f.isAvailable }))
              }
              title="Click to toggle availability"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${professional.isAvailable ? "bg-green-500" : "bg-gray-400"}`}
              />
              {professional.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* ── Sidebar nav (desktop) ────────────────────────────────────────── */}
        <nav className="hidden md:flex flex-col gap-1 shrink-0 w-44">
          {visibleSections.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active === s
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
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
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          {active === "Personal" && (
            <form onSubmit={savePersonal}>
              <SectionHeading
                title="Personal Information"
                desc="Update your name and contact details."
              />

              <div className="mb-4">
                <Label>Email address</Label>
                <Input value={profile?.email || ""} disabled />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label required>First name</Label>
                  <Input
                    value={personal.firstName}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, firstName: e.target.value }))
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label required>Last name</Label>
                  <Input
                    value={personal.lastName}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, lastName: e.target.value }))
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={personal.phone}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+94 77 000 0000"
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={personal.gender}
                    onChange={(e) =>
                      setPersonal((p) => ({ ...p, gender: e.target.value }))
                    }
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mb-6">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={personal.dateOfBirth}
                  onChange={(e) =>
                    setPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <SaveButton loading={saving.personal} />
              </div>
            </form>
          )}

          {/* ── Professional ── */}
          {active === "Professional" && (
            <form onSubmit={saveProfessional}>
              <SectionHeading
                title="Professional Information"
                desc="Your qualifications, specializations, and practice details."
              />

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>License Number</Label>
                  <Input
                    value={professional.licenseNumber}
                    onChange={(e) =>
                      setProfessional((p) => ({
                        ...p,
                        licenseNumber: e.target.value,
                      }))
                    }
                    placeholder="e.g. SLMC-123456"
                  />
                </div>
                <div>
                  <Label>Hospital / Clinic</Label>
                  <Input
                    value={professional.hospital}
                    onChange={(e) =>
                      setProfessional((p) => ({
                        ...p,
                        hospital: e.target.value,
                      }))
                    }
                    placeholder="e.g. National Hospital Colombo"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={professional.experience}
                    onChange={(e) =>
                      setProfessional((p) => ({
                        ...p,
                        experience: e.target.value,
                      }))
                    }
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <Label>Consultation Fee (USD)</Label>
                  <Input
                    type="number"
                    value={professional.consultationFee}
                    onChange={(e) =>
                      setProfessional((p) => ({
                        ...p,
                        consultationFee: e.target.value,
                      }))
                    }
                    placeholder="e.g. 50.00"
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label>Qualifications</Label>
                <textarea
                  value={professional.qualifications}
                  onChange={(e) =>
                    setProfessional((p) => ({
                      ...p,
                      qualifications: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="e.g. MBBS, MD (Cardiology), FRCP…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="mb-4">
                <Label>Profile Description</Label>
                <textarea
                  value={professional.description}
                  onChange={(e) =>
                    setProfessional((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Write a short introduction for patients about your practice and care approach..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="mb-4">
                <Label>Availability</Label>
                <button
                  type="button"
                  onClick={() =>
                    setProfessional((f) => ({
                      ...f,
                      isAvailable: !f.isAvailable,
                    }))
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition ${
                    professional.isAvailable
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${professional.isAvailable ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  {professional.isAvailable
                    ? "Currently Available"
                    : "Currently Unavailable"}
                </button>
              </div>

              <div className="mb-6">
                <Label>Specializations</Label>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map((spec) => {
                    const active = professional.specialization.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpec(spec)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                          active
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-600"
                        }`}
                      >
                        {active && <span className="mr-1">✓</span>}
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton loading={saving.professional} />
              </div>
            </form>
          )}

          {/* ── Address ── */}
          {active === "Address" && (
            <form onSubmit={saveAddress}>
              <SectionHeading
                title="Clinic / Practice Address"
                desc="Your clinic or practice location."
              />

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Street</Label>
                  <Input
                    value={address.street}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, street: e.target.value }))
                    }
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={address.city}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, city: e.target.value }))
                    }
                    placeholder="Colombo"
                  />
                </div>
                <div>
                  <Label>State / Province</Label>
                  <Input
                    value={address.state}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, state: e.target.value }))
                    }
                    placeholder="Western"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={address.country}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, country: e.target.value }))
                    }
                    placeholder="Sri Lanka"
                  />
                </div>
                <div>
                  <Label>ZIP / Postal Code</Label>
                  <Input
                    value={address.zipCode}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, zipCode: e.target.value }))
                    }
                    placeholder="10250"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton loading={saving.address} />
              </div>
            </form>
          )}

          {/* ── Security ── */}
          {!isGoogleAuth && active === "Security" && (
            <form onSubmit={savePassword}>
              <SectionHeading
                title="Change Password"
                desc="Use a strong password of at least 8 characters."
              />

              <div className="mb-4">
                <Label required>Current password</Label>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Current password"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label required>New password</Label>
                  <Input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <Label required>Confirm new password</Label>
                  <Input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <SaveButton loading={saving.security} label="Update Password" />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
