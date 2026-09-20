import { Navigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

/**
 * Wraps a route so only authenticated users (optionally with a specific role) can access it.
 * Usage: <Route element={<PrivateRoute allowedRoles={['patient']} />}>…</Route>
 */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
