import UserNavbar from '../Componets/PatientComponents/UserNavbar';
import { Outlet } from 'react-router-dom';

const PatientLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <UserNavbar />
      <Outlet />
    </div>
  );
};

export default PatientLayout;
