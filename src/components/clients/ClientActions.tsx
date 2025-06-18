import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { 
  MoreHorizontal, 
  Pencil, 
  RotateCw, 
  Mail, 
  Bell,
  Trash2
} from 'lucide-react';

interface ClientActionsProps {
  onEdit: () => void;
  onRenew: () => void;
  onSendCredentials: () => void;
  onSendReminder: () => void;
  onDelete: () => void;
}

export function ClientActions({
  onEdit,
  onRenew,
  onSendCredentials,
  onSendReminder,
  onDelete
}: ClientActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          <span>Editar Cliente</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRenew} className="cursor-pointer">
          <RotateCw className="mr-2 h-4 w-4" />
          <span>Renovar Plan</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSendCredentials} className="cursor-pointer">
          <Mail className="mr-2 h-4 w-4" />
          <span>Enviar Credenciales</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSendReminder} className="cursor-pointer">
          <Bell className="mr-2 h-4 w-4" />
          <span>Enviar Recordatorio</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Eliminar Cliente</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
