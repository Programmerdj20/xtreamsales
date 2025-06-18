import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import ResellersPage from './pages/ResellersPage';
import ClientsPage from './pages/ClientsPage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import UsersPage from './pages/admin/UsersPage';
import ActivateUsers from './pages/admin/ActivateUsers';
import './styles/phone-input.css';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              user.role === 'admin' ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/resellers" replace />
            ) : <LoginPage />
          }
        />
        
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resellers" element={<ResellersPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/activate-users" element={<ActivateUsers />} />
          </Route>
        </Route>

        {/* Redirigir / a /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
