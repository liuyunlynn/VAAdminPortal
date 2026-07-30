import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
