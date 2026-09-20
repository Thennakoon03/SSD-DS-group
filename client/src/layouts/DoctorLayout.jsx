import DoctorNavbar from '../Componets/DoctorComponents/DoctorNavbar';
import { Outlet } from 'react-router-dom';

const DoctorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DoctorNavbar />
      <Outlet />
    </div>
  );
};

export default DoctorLayout;
