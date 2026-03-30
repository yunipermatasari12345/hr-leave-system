import { Navigate } from "react-router-dom";
import { STORAGE_KEYS } from "../constants/storage";

export default function PrivateRoute({ children, role }) {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const userRole = localStorage.getItem(STORAGE_KEYS.role);

  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/login" replace />;

  return children;
}
