import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/Dashboard";
import HrdDashboard from "./pages/hrd/Dashboard";
import AddEmployee from "./pages/hrd/AddEmployee";
import NewLeave from "./pages/employee/NewLeave";

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/login" />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Halaman Karyawan */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute role="employee">
            <EmployeeDashboard />
          </PrivateRoute>
        }
      />

      {/* Halaman HRD */}
      <Route
        path="/hrd/dashboard"
        element={
          <PrivateRoute role="hrd">
            <HrdDashboard />
          </PrivateRoute>
        }
      />
      <Route
  path="/hrd/employees/add"
  element={
    <PrivateRoute role="hrd">
      <AddEmployee />
    </PrivateRoute>
  }
/>
<Route
  path="/leaves/new"
  element={
    <PrivateRoute role="employee">
      <NewLeave />
    </PrivateRoute>
  }
/>
    </Routes>
  );
}