import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import PrivateRoute from './Componets/SharedComponents/PrivateRoute';
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import LoginPage  from './Pages/SharedPages/LoginPage';
import SignupPage from './Pages/SharedPages/SignupPage';
import AllDoctors from './Pages/PatientPages/AllDoctors';
import ViewDoctor from './Pages/PatientPages/ViewDoctor';
import PatientProfile from './Pages/PatientPages/PatientProfile';
import MakeAppointment from './Pages/PatientPages/MakeAppointment';
import MyAppointments from './Pages/PatientPages/MyAppointments';
import PatientAppointmentDetails from './Pages/PatientPages/PatientAppointmentDetails';
import PaymentCheckout from './Pages/PatientPages/PaymentCheckout';
import TelemedicineRoom from './Pages/PatientPages/TelemedicineRoom';
import MyReports from './Pages/PatientPages/MyReports';
import SymptomChecker from './Pages/PatientPages/SymptomChecker';
import AppointmentDetails from './Pages/DoctorPages/AppointmentDetails';
import DoctorAppointments from './Pages/DoctorPages/DoctorAppointments';
import DoctorProfile from './Pages/DoctorPages/DoctorProfile';
import DoctorTelemedicineRoom from './Pages/DoctorPages/DoctorTelemedicineRoom';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './Pages/AdminPages/AdminDashboard';
import ManageDoctors from './Pages/AdminPages/ManageDoctors';
import ManagePatients from './Pages/AdminPages/ManagePatients';
import ManageAdmins from './Pages/AdminPages/ManageAdmins';
import ManageAppointments from './Pages/AdminPages/ManageAppointments';
import ManagePayments from './Pages/AdminPages/ManagePayments';
import AdminProfile from './Pages/AdminPages/AdminProfile';
import Landing from './Pages/SharedPages/Landing';
import PatientDashboard from './Pages/PatientPages/PatientDashboard';
import DoctorDashboard from './Pages/DoctorPages/DoctorDashboard';
import { useTheme } from './Context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { theme } = useTheme();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style:
              theme === 'dark'
                ? {background: '#0f172a', color: '#f8fafc', border: '1px solid #334155'}
                : {background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0'},
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Patient — all wrapped in PrivateRoute + PatientLayout */}
          <Route
            path="/patient"
            element={
              <PrivateRoute allowedRoles={['patient']}>
                <PatientLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="doctors" element={<AllDoctors />} />
            <Route path="doctors/:id" element={<ViewDoctor />} />
            <Route path="appointments" element={<MyAppointments />} />
            <Route path="appointments/:id" element={<PatientAppointmentDetails />} />
            <Route path="appointments/book/:doctorId" element={<MakeAppointment />} />
            <Route path="payment/:appointmentId" element={<PaymentCheckout />} />
            <Route path="telemedicine/:appointmentId" element={<TelemedicineRoom />} />
            <Route path="reports" element={<MyReports />} />
            <Route path="symptom-checker" element={<SymptomChecker />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Doctor */}
          <Route
            path="/doctor"
            element={
              <PrivateRoute allowedRoles={['doctor']}>
                <DoctorLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="appointments/:id" element={<AppointmentDetails />} />
            <Route path="telemedicine/:appointmentId" element={<DoctorTelemedicineRoom />} />
            <Route path="profile" element={<DoctorProfile />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="doctors" element={<ManageDoctors />} />
            <Route path="patients" element={<ManagePatients />} />
            <Route path="admins" element={<ManageAdmins />} />
            <Route path="appointments" element={<ManageAppointments />} />
            <Route path="transactions" element={<ManagePayments />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Unauthorized */}
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500 text-lg font-medium">403 — Access Denied</p>
              </div>
            }
          />

          {/* Default */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
