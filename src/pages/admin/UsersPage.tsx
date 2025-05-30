import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../services/supabaseAdmin";
import { UserRoleModal } from "../../components/admin/UserRoleModal";
import { Button } from "../../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";
import { Shield, User, AlertTriangle, Check, X } from "lucide-react";
import { Input } from "../../components/ui/input";

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pendingCount, setPendingCount] = useState(0);

    const fetchUsers = async () => {
        try {
            console.log('Obteniendo usuarios...');
            setLoading(true);
            
            // Obtener todos los usuarios directamente de la API de autenticación
            console.log('Obteniendo usuarios de auth...');
            const { data: sessionData } = await supabase.auth.getSession();
            
            if (!sessionData || !sessionData.session) {
                console.error('No hay sesión activa');
                toast.error("Debes iniciar sesión para ver los usuarios");
                setUsers([]);
                setPendingCount(0);
                return;
            }
            
            // Usar la función RPC que sabemos que funciona
            console.log('Obteniendo usuarios con RPC...');
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_profiles');
            
            if (rpcError) {
                console.error('Error con RPC:', rpcError);
                
                // Si falla, obtener usuarios de auth directamente
                console.log('Fallback: obteniendo usuarios de auth directamente...');
                const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
                
                if (authError) {
                    console.error('Error al obtener usuarios de auth:', authError);
                    throw authError;
                }
                
                if (authData && authData.users) {
                    console.log('Usuarios obtenidos de auth:', authData.users.length);
                    
                    // Convertir usuarios de auth a formato de usuario y eliminar duplicados por ID
                    const formattedUsers = authData.users.map(user => ({
                        id: user.id,
                        email: user.email || '',
                        full_name: user.user_metadata?.full_name || '',
                        role: user.user_metadata?.role || 'reseller',
                        status: user.user_metadata?.status || 'pending',
                        created_at: user.created_at || new Date().toISOString()
                    }));
                    
                    // Eliminar duplicados por ID
                    const uniqueUsers = Array.from(new Map(formattedUsers.map(user => [user.id, user])).values()) as User[];
                    
                    console.log('Usuarios únicos formateados:', uniqueUsers.length);
                    setUsers(uniqueUsers);
                    
                    // Contar usuarios pendientes
                    const pendingUsers = uniqueUsers.filter(user => user.status === 'pending') || [];
                    setPendingCount(pendingUsers.length);
                } else {
                    console.warn('No se encontraron usuarios en auth');
                    setUsers([]);
                    setPendingCount(0);
                }
            } else if (rpcData && rpcData.length > 0) {
                console.log('Usuarios obtenidos de RPC:', rpcData.length);
                
                // Eliminar duplicados por ID
                const uniqueUsers = Array.from(new Map(rpcData.map(user => [user.id, user])).values()) as User[];
                console.log('Usuarios únicos de RPC:', uniqueUsers.length);
                
                setUsers(uniqueUsers);
                
                // Contar usuarios pendientes
                const pendingUsers = uniqueUsers.filter(user => user.status === 'pending') || [];
                setPendingCount(pendingUsers.length);
            } else {
                console.warn('No se encontraron usuarios con RPC');
                setUsers([]);
                setPendingCount(0);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Error al cargar usuarios");
            setUsers([]);
            setPendingCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500/20 text-green-500";
            case "pending":
                return "bg-yellow-500/20 text-yellow-500";
            case "inactive":
                return "bg-red-500/20 text-red-500";
            default:
                return "bg-gray-500/20 text-gray-500";
        }
    };

    const getRoleLabel = (role: string) => {
        return role === "admin" ? "Administrador" : "Revendedor";
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "active":
                return "Activo";
            case "pending":
                return "Pendiente";
            case "inactive":
                return "Inactivo";
            default:
                return status;
        }
    };

    // Filtrar usuarios según el término de búsqueda
    const filteredUsers = users.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.email.toLowerCase().includes(searchLower) ||
            user.full_name.toLowerCase().includes(searchLower) ||
            getStatusLabel(user.status).toLowerCase().includes(searchLower) ||
            getRoleLabel(user.role).toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="p-4 flex items-center justify-center h-64">
                Cargando usuarios...
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">
                        Administra los usuarios del sistema
                    </p>
                </div>

                {pendingCount > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">
                            {pendingCount}{" "}
                            {pendingCount === 1
                                ? "usuario pendiente"
                                : "usuarios pendientes"}{" "}
                            de activación
                        </span>
                    </div>
                )}
            </div>

            <div className="mb-4">
                <Input
                    placeholder="Buscar usuarios por nombre, email, rol o estado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha de Registro</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No se encontraron usuarios que coincidan con
                                    la búsqueda
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className={
                                        user.status === "pending"
                                            ? "bg-yellow-500/5"
                                            : ""
                                    }
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {user.full_name || "Sin nombre"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {user.role === "admin" ? (
                                                <Shield className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <User className="h-4 w-4 text-green-500" />
                                            )}
                                            <span>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs w-fit ${getStatusBadgeClass(
                                                user.status
                                            )}`}
                                        >
                                            {user.status === "active" && (
                                                <Check className="h-3 w-3" />
                                            )}
                                            {user.status === "pending" && (
                                                <AlertTriangle className="h-3 w-3" />
                                            )}
                                            {user.status === "inactive" && (
                                                <X className="h-3 w-3" />
                                            )}
                                            {getStatusLabel(user.status)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString("es-ES")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant={
                                                user.status === "pending"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() => handleEditUser(user)}
                                            className={
                                                user.status === "pending"
                                                    ? "bg-yellow-500 hover:bg-yellow-600"
                                                    : ""
                                            }
                                        >
                                            {user.status === "pending"
                                                ? "Activar"
                                                : "Gestionar"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedUser && (
                <UserRoleModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                    }}
                    userId={selectedUser.id}
                    userEmail={selectedUser.email}
                    userName={selectedUser.full_name || ""}
                    currentRole={selectedUser.role}
                    currentStatus={selectedUser.status}
                    onUpdate={fetchUsers}
                />
            )}
        </div>
    );
}
