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
    <header className="h-14 lg:h-16 bg-card text-card-foreground shadow-md flex items-center justify-between px-3 lg:px-4">
      {/* Botón para colapsar/expandir Sidebar */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none"
      >
        <Menu className="h-5 w-5 lg:h-6 lg:w-6" />
      </button>

      {/* Saludo al usuario y rol - Alineado a la derecha */}
      <div className="flex items-center space-x-2">
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Hola, </span>{user?.full_name || 'Usuario'} <span className="hidden md:inline">({user?.role === 'admin' ? 'Admin' : 'Revendedor'})</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
