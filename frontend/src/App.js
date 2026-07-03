import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyRides   from './pages/MyRides';
import Savings   from './pages/Savings';

// ─── Protected route — redirect to login if not logged in ─────────────────────
function Protected({ children }) {
  const { employee } = useAuth();
  return employee ? children : <Navigate to="/login" replace />;
}

// ─── Public route — redirect to dashboard if ALREADY logged in ───────────────
// This prevents logged-in users from seeing /login or /register again
// when they revisit the site or close and reopen the tab
function PublicOnly({ children }) {
  const { employee } = useAuth();
  return employee ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Root → go to dashboard if logged in, login if not */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public routes — skip these if already logged in */}
          <Route path="/login"    element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          {/* Protected routes — require login */}
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/my-rides"  element={<Protected><MyRides /></Protected>} />
          <Route path="/savings"   element={<Protected><Savings /></Protected>} />

          {/* Any unknown URL → go to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
