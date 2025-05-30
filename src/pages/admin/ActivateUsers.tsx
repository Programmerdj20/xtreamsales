import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { updateUserStatus } from "../../services/userStatusService";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
}

export default function ActivateUsers() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      console.log("Obteniendo usuarios pendientes...");

      // Obtener perfiles con RPC
      const { data, error } = await supabase.rpc("get_all_profiles");

      if (error) {
        console.error("Error al obtener perfiles:", error);
        toast.error("Error al cargar usuarios pendientes");
        return;
      }

      // Filtrar solo usuarios pendientes
      const pending = data?.filter((user) => user.status === "pending") || [];
      console.log(`Encontrados ${pending.length} usuarios pendientes`);
      setPendingUsers(pending);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar usuarios pendientes");
    } finally {
      setLoading(false);
    }
  };

  const activateAllUsers = async () => {
    try {
      setActivating(true);
      console.log("Activando todos los usuarios pendientes...");

      for (const user of pendingUsers) {
        console.log(`Activando usuario: ${user.email} (${user.id})`);
        await updateUserStatus(user.id, "active");
      }

      toast.success("Todos los usuarios pendientes han sido activados");
      fetchPendingUsers(); // Actualizar la lista
    } catch (error) {
      console.error("Error al activar usuarios:", error);
      toast.error("Error al activar usuarios");
    } finally {
      setActivating(false);
    }
  };

  const activateUser = async (userId: string, email: string) => {
    try {
      console.log(`Activando usuario: ${email} (${userId})`);
      await updateUserStatus(userId, "active");
      toast.success(`Usuario ${email} activado correctamente`);
      fetchPendingUsers(); // Actualizar la lista
    } catch (error) {
      console.error(`Error al activar usuario ${email}:`, error);
      toast.error(`Error al activar usuario ${email}`);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Activar Usuarios Pendientes</h1>
        <Button
          onClick={fetchPendingUsers}
          variant="outline"
          disabled={loading}
        >
          Actualizar
        </Button>
      </div>

      {loading ? (
        <p>Cargando usuarios pendientes...</p>
      ) : pendingUsers.length === 0 ? (
        <p>No hay usuarios pendientes de activación.</p>
      ) : (
        <>
          <div className="mb-4">
            <Button
              onClick={activateAllUsers}
              disabled={activating || pendingUsers.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {activating
                ? "Activando usuarios..."
                : `Activar Todos (${pendingUsers.length})`}
            </Button>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">
                Usuarios Pendientes ({pendingUsers.length})
              </h2>
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-3 bg-background rounded-md border border-border"
                  >
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registrado el{" "}
                        {new Date(user.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Button
                      onClick={() => activateUser(user.id, user.email)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Activar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
