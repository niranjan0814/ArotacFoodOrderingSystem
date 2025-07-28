import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, role }) {
  const token = localStorage.getItem(`${role}Token`);
  return token ? children : <Navigate to="/login" />;
}