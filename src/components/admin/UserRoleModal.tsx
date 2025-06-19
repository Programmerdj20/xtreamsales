import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { authService } from "../../services/auth";
import { toast } from "sonner";
import {
    Trash2,
    UserCog,
    AlertTriangle,
    Shield,
    User,
    Mail,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface UserRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userEmail: string;
    userName: string;
    currentRole: string;
    currentStatus: string;
    onUpdate: () => void;
}

export function UserRoleModal({
    isOpen,
    onClose,
    userId,
    userEmail,
    userName,
    currentRole,
    currentStatus,
    onUpdate,
}: UserRoleModalProps) {
    const [role, setRole] = useState(currentRole);
    const [status, setStatus] = useState(currentStatus);
    const [name, setName] = useState(userName);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("1 Mes");
    const [planEndDate, setPlanEndDate] = useState("");

    // Función para calcular la fecha fin según el plan
    const calculateEndDate = (plan: string) => {
        const today = new Date();
        switch (plan) {
            case "Demo (24 Hrs)":
                return new Date(today.setDate(today.getDate() + 1));
            case "1 Mes":
                return new Date(today.setMonth(today.getMonth() + 1));
            case "3 Meses":
                return new Date(today.setMonth(today.getMonth() + 3));
            case "6 Meses":
                return new Date(today.setMonth(today.getMonth() + 6));
            case "12 Meses":
                return new Date(today.setMonth(today.getMonth() + 12));
            default:
                return today;
        }
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    // Inicializar fecha de plan cuando se monta el componente
    React.useEffect(() => {
        setPlanEndDate(formatDate(calculateEndDate(selectedPlan)));
    }, [selectedPlan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("Iniciando actualización de usuario:", {
                userId,
                role,
                status,
                name,
            });

            // Actualizar rol si cambió
            if (role !== currentRole) {
                console.log("Actualizando rol de usuario...");
                const { data: rpcResult, error: rpcError } = await supabase.rpc(
                    "update_user_role",
                    {
                        user_id: userId,
                        new_role: role,
                    }
                );

                if (rpcError) {
                    console.error("Error al actualizar rol con RPC:", rpcError);
                    throw rpcError;
                } else {
                    console.log(
                        "Rol actualizado correctamente con RPC:",
                        rpcResult
                    );
                }
            }

            // Actualizar estado si cambió
            if (status !== currentStatus) {
                console.log("Actualizando estado de usuario...");
                const { data: rpcResult, error: rpcError } = await supabase.rpc(
                    "update_user_status",
                    {
                        user_id: userId,
                        new_status: status,
                    }
                );

                if (rpcError) {
                    console.error(
                        "Error al actualizar estado con RPC:",
                        rpcError
                    );
                    throw rpcError;
                } else {
                    console.log(
                        "Estado actualizado correctamente con RPC:",
                        rpcResult
                    );
                }

                // Si es un revendedor y se está activando, actualizar el plan
                if (
                    role === "reseller" &&
                    status === "active" &&
                    currentStatus === "pending"
                ) {
                    console.log("Actualizando plan del revendedor...");
                    const { data: planResult, error: planError } =
                        await supabase.rpc("update_reseller_info", {
                            reseller_id: userId,
                            reseller_phone: null, // No actualizamos el teléfono
                            reseller_plan_type: selectedPlan,
                            reseller_plan_end_date: new Date(
                                planEndDate + "T23:59:59"
                            ).toISOString(),
                        });

                    if (planError) {
                        console.error(
                            "Error al actualizar plan del revendedor:",
                            planError
                        );
                        throw planError;
                    } else {
                        console.log(
                            "Plan del revendedor actualizado correctamente:",
                            planResult
                        );
                    }
                }
            }

            // Actualizar nombre si cambió y estamos en modo edición
            if (isEditing && name !== userName) {
                console.log("Actualizando nombre de usuario...");

                try {
                    // Usar la función RPC update_profile_name para actualizar el nombre en todas las tablas
                    console.log(
                        "Actualizando nombre con RPC update_profile_name..."
                    );
                    const { data: rpcResult, error: rpcError } =
                        await supabase.rpc("update_profile_name", {
                            user_id: userId,
                            new_name: name,
                        });

                    if (rpcError) {
                        console.error(
                            "Error al actualizar nombre con RPC:",
                            rpcError
                        );
                        throw rpcError;
                    } else {
                        console.log(
                            "Nombre actualizado correctamente con RPC:",
                            rpcResult
                        );
                    }

                    // Intentar actualizar también los metadatos del usuario en auth si es posible
                    try {
                        console.log(
                            "Intentando actualizar metadatos del usuario..."
                        );
                        const { data: sessionData } =
                            await supabase.auth.getSession();
                        if (sessionData?.session) {
                            const { error: updateError } =
                                await supabase.auth.updateUser({
                                    data: { full_name: name },
                                });

                            if (updateError) {
                                console.error(
                                    "Error al actualizar metadatos con updateUser:",
                                    updateError
                                );
                            } else {
                                console.log(
                                    "Metadatos actualizados con updateUser"
                                );
                            }
                        }
                    } catch (err) {
                        console.error(
                            "Excepción al actualizar metadatos:",
                            err
                        );
                        // No lanzar error aquí para no interrumpir el flujo principal
                    }
                } catch (err) {
                    console.error("Excepción al actualizar nombre:", err);
                    throw err;
                }
            }

            toast.success("Usuario actualizado exitosamente");
            onUpdate();
            onClose();
        } catch (error: any) {
            toast.error(
                "Error al actualizar el usuario: " +
                    (error.message || "Error desconocido")
            );
            console.error("Error general en actualización:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }

        setLoading(true);
        try {
            // Paso 1: Eliminar usuario de las tablas de la base de datos usando RPC
            console.log("Eliminando usuario de las tablas con RPC...");
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
                "delete_user",
                {
                    user_id: userId,
                }
            );

            if (rpcError) {
                console.error("Error al eliminar usuario con RPC:", rpcError);
                throw rpcError;
            } else {
                console.log(
                    "Usuario eliminado correctamente de las tablas:",
                    rpcResult
                );
            }

            // Paso 2: Intentar eliminar el usuario de Auth usando authService (omitido)
            // Si deseas eliminar completamente de Auth, debe hacerse manualmente o desde un backend seguro.
            // Ya no mostramos advertencias ni errores relacionados con Auth aquí.

            toast.success("Usuario eliminado exitosamente");
            onUpdate();
            onClose();
        } catch (error: any) {
            toast.error(
                "Error al eliminar el usuario: " +
                    (error.message || "Error desconocido")
            );
            console.error("Error:", error);
        } finally {
            setLoading(false);
            setDeleteConfirm(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={loading ? undefined : onClose}>
            <DialogContent className="sm:max-w-[500px] bg-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        {role === "admin" ? (
                            <Shield className="h-5 w-5" />
                        ) : (
                            <User className="h-5 w-5" />
                        )}
                        Gestionar Usuario
                    </DialogTitle>
                    <DialogDescription>
                        {status === "pending" && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start space-x-2 mt-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-500">
                                    Este usuario está pendiente de activación
                                </p>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {deleteConfirm ? (
                    <div className="py-4 space-y-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex flex-col items-center justify-center space-y-3">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                            <h3 className="text-lg font-semibold text-red-500">
                                ¿Eliminar este usuario?
                            </h3>
                            <p className="text-sm text-center text-muted-foreground">
                                Esta acción no se puede deshacer. El usuario
                                perderá todo acceso al sistema.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setDeleteConfirm(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                {loading
                                    ? "Eliminando..."
                                    : "Confirmar Eliminación"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" /> Email
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {userEmail}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        className="flex items-center gap-1"
                                        htmlFor="name"
                                    >
                                        <User className="h-4 w-4" /> Nombre
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            placeholder="Nombre completo"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                {name}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setIsEditing(true)
                                                }
                                                className="h-6 px-2 text-xs"
                                            >
                                                Editar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="role"
                                        className="flex items-center gap-1"
                                    >
                                        <UserCog className="h-4 w-4" /> Rol
                                    </Label>
                                    <Select
                                        value={role}
                                        onValueChange={setRole}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">
                                                Administrador
                                            </SelectItem>
                                            <SelectItem value="reseller">
                                                Revendedor
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="status"
                                        className="flex items-center gap-1"
                                    >
                                        <Shield className="h-4 w-4" /> Estado
                                    </Label>
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Activo
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                Pendiente
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactivo
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Sección de Plan para Revendedores */}
                            {role === "reseller" && status === "pending" && (
                                <div className="space-y-4 pt-4 border-t border-border/10">
                                    <h3 className="text-sm font-medium text-foreground">
                                        Configuración del Plan
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="plan"
                                                className="text-sm font-medium"
                                            >
                                                Plan de Suscripción
                                            </Label>
                                            <Select
                                                value={selectedPlan}
                                                onValueChange={(value) => {
                                                    setSelectedPlan(value);
                                                    setPlanEndDate(
                                                        formatDate(
                                                            calculateEndDate(
                                                                value
                                                            )
                                                        )
                                                    );
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Demo (24 Hrs)">
                                                        Demo (24 Hrs)
                                                    </SelectItem>
                                                    <SelectItem value="1 Mes">
                                                        1 Mes
                                                    </SelectItem>
                                                    <SelectItem value="3 Meses">
                                                        3 Meses
                                                    </SelectItem>
                                                    <SelectItem value="6 Meses">
                                                        6 Meses
                                                    </SelectItem>
                                                    <SelectItem value="12 Meses">
                                                        12 Meses
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="planEndDate"
                                                className="text-sm font-medium"
                                            >
                                                Fecha Fin
                                            </Label>
                                            <Input
                                                id="planEndDate"
                                                type="date"
                                                value={planEndDate}
                                                onChange={(e) =>
                                                    setPlanEndDate(
                                                        e.target.value
                                                    )
                                                }
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {status === "pending" && (
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setStatus("active")}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        Activar Usuario
                                    </Button>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex justify-between items-center pt-2 gap-2">
                            <Button
                                variant="destructive"
                                type="button"
                                onClick={() => setDeleteConfirm(true)}
                                disabled={loading}
                                className="flex items-center gap-1"
                            >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                            </Button>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading
                                        ? "Guardando..."
                                        : "Guardar Cambios"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
