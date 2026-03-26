import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Targets from './pages/Targets';
import KPIEntry from './pages/KPIEntry';
import Reviews from './pages/Reviews';
import Incentives from './pages/Incentives';
import Settings from './pages/Settings';
import Gradings from './pages/Gradings';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAdminOrManager } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isAdminOrManager) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
        <Route path="/employees/:id" element={<PrivateRoute><EmployeeDetail /></PrivateRoute>} />
        <Route path="/targets" element={<PrivateRoute><Targets /></PrivateRoute>} />
        <Route path="/kpi" element={<PrivateRoute><KPIEntry /></PrivateRoute>} />
        <Route path="/reviews" element={<PrivateRoute><Reviews /></PrivateRoute>} />
        <Route path="/incentives" element={<PrivateRoute><Incentives /></PrivateRoute>} />
        <Route path="/gradings" element={<PrivateRoute><Gradings /></PrivateRoute>} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}
