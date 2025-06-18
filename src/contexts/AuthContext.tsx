import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, type User } from "../services/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ user: User }>;
    logout: () => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>; // Añadir esta línea
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const user = await authService.getCurrentUser();
            setUser(user);
        } catch (error) {
            console.error("Error checking user:", error);
        } finally {
            setLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const response = await authService.login(email, password);
        setUser(response.user as User);
        return { user: response.user as User };
    }

    async function logout() {
        await authService.logout();
        setUser(null);
    }

    // Nueva función para actualizar la contraseña
    async function updatePassword(newPassword: string) {
        await authService.updateUserPassword(newPassword);
        // No es necesario actualizar el estado del usuario aquí, ya que la contraseña no es parte del objeto user visible
    }

    const value = {
        user,
        loading,
        login,
        logout,
        updatePassword, // Añadir esta línea
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
