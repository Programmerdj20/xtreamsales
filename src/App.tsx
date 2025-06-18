import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import ResellersPage from "./pages/ResellersPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import TemplatesPage from "./pages/TemplatesPage";
import UsersPage from "./pages/admin/UsersPage";
import ActivateUsers from "./pages/admin/ActivateUsers";
import "./styles/phone-input.css";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Importar las nuevas páginas de revendedor
import ResellerDashboardPage from "./pages/reseller/ResellerDashboardPage";
import ResellerClientsPage from "./pages/reseller/ResellerClientsPage";
import ResellerTemplatesPage from "./pages/reseller/ResellerTemplatesPage";
import ResellerSettingsPage from "./pages/reseller/ResellerSettingsPage";

function AppContent() {
    const { user } = useAuth();
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        user ? (
                            user.role === "admin" ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <Navigate to="/reseller/clients" replace />
                            ) // Redirigir a clientes de revendedor
                        ) : (
                            <LoginPage />
                        )
                    }
                />

                {/* Rutas protegidas para administradores */}
                <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/resellers" element={<ResellersPage />} />
                        <Route path="/clients" element={<ClientsPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/admin/users" element={<UsersPage />} />
                        <Route
                            path="/admin/activate-users"
                            element={<ActivateUsers />}
                        />
                    </Route>
                </Route>

                {/* Rutas protegidas para revendedores */}
                <Route element={<ProtectedRoute requiredRole="reseller" />}>
                    <Route element={<MainLayout />}>
                        <Route
                            path="/reseller/dashboard"
                            element={<ResellerDashboardPage />}
                        />
                        <Route
                            path="/reseller/clients"
                            element={<ResellerClientsPage />}
                        />
                        <Route
                            path="/reseller/templates"
                            element={<ResellerTemplatesPage />}
                        />
                        <Route
                            path="/reseller/settings"
                            element={<ResellerSettingsPage />}
                        />
                    </Route>
                </Route>

                {/* Redirigir / a /dashboard (para admin) o /reseller/clients (para reseller) */}
                <Route
                    path="/"
                    element={
                        user ? (
                            user.role === "admin" ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <Navigate to="/reseller/clients" replace />
                            )
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
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
