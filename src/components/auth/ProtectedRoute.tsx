import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
    requiredRole?: "admin" | "reseller";
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si se requiere un rol específico y el usuario no tiene ese rol, redirigir
    if (requiredRole && user.role !== requiredRole) {
        // Redirigir al dashboard apropiado si el usuario está logueado pero no tiene el rol correcto
        if (user.role === "admin") {
            return <Navigate to="/dashboard" replace />;
        } else if (user.role === "reseller") {
            return <Navigate to="/reseller/dashboard" replace />;
        }
        // Si no es admin ni reseller, o no hay un dashboard definido para su rol, redirigir a login
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
