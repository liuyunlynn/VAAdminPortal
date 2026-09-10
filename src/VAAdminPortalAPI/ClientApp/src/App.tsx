import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Button, Card, Spinner, Title2 } from '@fluentui/react-components';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { getAdminInfo, HttpError } from './api/client';
import type { AdminInfo } from './api/types';

type SessionState =
  | { status: 'loading'; admin: null }
  | { status: 'authenticated'; admin: AdminInfo }
  | { status: 'unauthenticated' | 'forbidden'; admin: null };

export default function App() {
  const [session, setSession] = useState<SessionState>({
    status: 'loading',
    admin: null,
  });

  useEffect(() => {
    let active = true;
    getAdminInfo()
      .then((admin) => {
        if (active) setSession({ status: 'authenticated', admin });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSession({
          status: error instanceof HttpError && error.status === 403
            ? 'forbidden'
            : 'unauthenticated',
          admin: null,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (session.status === 'loading') {
    return (
      <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
        <Spinner label="Checking your session..." />
      </div>
    );
  }

  if (session.status === 'forbidden') {
    return (
      <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: 24 }}>
        <Card style={{ maxWidth: 480, padding: 32, textAlign: 'center' }}>
          <Title2>Access denied</Title2>
          <p>Your Microsoft account is not authorized to access this portal.</p>
          <Button
            appearance="primary"
            onClick={() => window.location.assign('/auth/logout')}
          >
            Sign out
          </Button>
        </Card>
      </div>
    );
  }

  const isAuthenticated = session.status === 'authenticated';

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated
          ? <DashboardPage admin={session.admin} />
          : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
