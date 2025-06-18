import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner"; // Asumiendo que sonner está instalado para notificaciones

const ResellerSettingsPage: React.FC = () => {
    const { user, updatePassword } = useAuth(); // Asumiendo que updatePassword existe en AuthContext
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            return;
        }
        if (newPassword.length < 6) {
            // Supabase default min password length
            toast.error("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setIsUpdating(true);
        try {
            // Aquí llamarías a la función de Supabase para actualizar la contraseña
            // Por ahora, simulamos una llamada
            // await supabase.auth.updateUser({ password: newPassword });
            // O si tienes una función en tu AuthContext:
            await updatePassword(newPassword);
            toast.success("Contraseña actualizada exitosamente.");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Error al cambiar la contraseña:", error);
            toast.error("Error al cambiar la contraseña. Inténtalo de nuevo.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                Configuración del Revendedor
            </h1>

            <div className="bg-card p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">
                    Datos de la Cuenta
                </h2>
                <p>
                    <strong>Email:</strong> {user?.email}
                </p>
                {/* Aquí podrías añadir más datos del usuario si están disponibles en el objeto user */}
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                    Cambiar Contraseña
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirm-password">
                            Confirmar Contraseña
                        </Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="mt-1"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full"
                    >
                        {isUpdating ? "Cambiando..." : "Cambiar Contraseña"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResellerSettingsPage;
