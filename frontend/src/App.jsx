import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/Dashboard";
import HrdDashboard from "./pages/hrd/Dashboard";
import AddEmployee from "./pages/hrd/AddEmployee";
import NewLeave from "./pages/employee/NewLeave";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Redirect untuk memastikan URL lama tetap berfungsi setelah perombakan */}
      <Route path="/employee/leave/new" element={<Navigate to="/leaves/new" replace />} />
      <Route path="/hrd/add-employee" element={<Navigate to="/hrd/employees/add" replace />} />


      <Route
        path="/dashboard"
        element={
          <PrivateRoute role="employee">
            <EmployeeDashboard />
          </PrivateRoute>
        }
      />

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
