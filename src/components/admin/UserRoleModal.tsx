import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { authService } from "../../services/auth";
import { updateUserStatus } from "../../services/userStatusService";
import { toast } from 'sonner';
import { Trash2, UserCog, AlertTriangle, Shield, User, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  onUpdate
}: UserRoleModalProps) {
  const [role, setRole] = useState(currentRole);
  const [status, setStatus] = useState(currentStatus);
  const [name, setName] = useState(userName);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Actualizar rol si cambió
      if (role !== currentRole) {
        await authService.updateUserRole(userId, role as 'admin' | 'reseller');
      }

      // Actualizar estado si cambió
      if (status !== currentStatus) {
        await updateUserStatus(userId, status as 'active' | 'inactive' | 'pending');
      }

      // Actualizar nombre si cambió y estamos en modo edición
      if (isEditing && name !== userName) {
        // Actualizar en profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: name })
          .eq('id', userId);

        if (profileError) throw profileError;

        // Actualizar en resellers si es un revendedor
        if (role === 'reseller') {
          const { error: resellerError } = await supabase
            .from('resellers')
            .update({ full_name: name })
            .eq('id', userId);

          if (resellerError) console.error('Error al actualizar nombre en resellers:', resellerError);
        }

        // Actualizar metadatos del usuario
        const { error: metadataError } = await supabase.auth.admin.updateUserById(
          userId,
          { user_metadata: { full_name: name } }
        );

        if (metadataError) console.error('Error al actualizar metadatos:', metadataError);
      }

      toast.success('Usuario actualizado exitosamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error('Error al actualizar el usuario');
      console.error('Error:', error);
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
      // Eliminar de la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Eliminar de la tabla resellers si es un revendedor
      if (role === 'reseller') {
        const { error: resellerError } = await supabase
          .from('resellers')
          .delete()
          .eq('id', userId);

        if (resellerError) console.error('Error al eliminar de resellers:', resellerError);
      }

      // Eliminar el usuario de auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

      toast.success('Usuario eliminado exitosamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error('Error al eliminar el usuario');
      console.error('Error:', error);
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
            {role === 'admin' ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
            Gestionar Usuario
          </DialogTitle>
          <DialogDescription>
            {status === 'pending' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start space-x-2 mt-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-500">Este usuario está pendiente de activación</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {deleteConfirm ? (
          <div className="py-4 space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex flex-col items-center justify-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-red-500" />
              <h3 className="text-lg font-semibold text-red-500">¿Eliminar este usuario?</h3>
              <p className="text-sm text-center text-muted-foreground">Esta acción no se puede deshacer. El usuario perderá todo acceso al sistema.</p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setDeleteConfirm(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="destructive" type="button" onClick={handleDelete} disabled={loading}>
                {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
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
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-1" htmlFor="name">
                    <User className="h-4 w-4" /> Nombre
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre completo"
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{name}</p>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
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
                  <Label htmlFor="role" className="flex items-center gap-1">
                    <UserCog className="h-4 w-4" /> Rol
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="reseller">Revendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-1">
                    <Shield className="h-4 w-4" /> Estado
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {status === 'pending' && (
                <div className="pt-2">
                  <Button 
                    type="button" 
                    onClick={() => setStatus('active')} 
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
                <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
