import React from 'react';
import { Menu, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean; 
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarCollapsed }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-card text-card-foreground shadow-md flex items-center justify-between px-4">
      {/* Botón para colapsar/expandir Sidebar */}
      <button 
        onClick={toggleSidebar}
        className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none" // Eliminadas clases focus:ring-*
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Saludo al usuario y rol - Alineado a la derecha */}
      <div className="flex items-center space-x-2">
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Hola, {user?.full_name || 'Usuario'} ({user?.role === 'admin' ? 'Admin' : 'Revendedor'})
          </span>
        </div>
        {/* Aquí podrían ir otros iconos o un dropdown para el perfil/logout si se decide moverlo del sidebar */}
      </div>
    </header>
  );
};

export default Header;
